// generate-article-list.js
const fs = require('fs');
const path = require('path');

const OUT = path.join(process.cwd(), 'article-list.json');
const ARTICLES_DIR = path.join(process.cwd(), 'articles');

function extractTitleFromHtml(content) {
  // 优先查 <h1> 标签，其次 <title>，否则用文件名
  const h1 = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return h1[1].trim();
  const title = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) return title[1].trim();
  return null;
}

if (!fs.existsSync(ARTICLES_DIR)) {
  console.log('No articles directory found, creating empty list.');
  fs.writeFileSync(OUT, JSON.stringify([], null, 2), 'utf-8');
  process.exit(0);
}

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.html'));
const items = files.map(f => {
  const full = path.join(ARTICLES_DIR, f);
  const raw = fs.readFileSync(full, 'utf-8');
  const title = extractTitleFromHtml(raw) || f;
  const stat = fs.statSync(full);
  return {
    title,
    file: f,
    date: stat.mtime.toISOString().split('T')[0]
  };
});

// 可按时间排序（最近的在前）
items.sort((a,b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(OUT, JSON.stringify(items, null, 2), 'utf-8');
console.log('article-list.json updated with', items.length, 'items.');