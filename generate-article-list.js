// generate-article-list.js
// Node.js script (CommonJS) - generate article-list.json from ./articles/*.html

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(process.cwd(), 'articles');
const OUT_FILE = path.join(process.cwd(), 'article-list.json');

function readTitleAndExcerpt(html) {
  // 提取第一个 <h1> 作为标题
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let title = h1 ? h1[1].replace(/<[^>]+>/g, '').trim() : null;

  // 提取正文首段作为 excerpt（去掉 HTML 标签，换行->空格）
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  // 先移除脚本与样式
  const cleaned = body.replace(/<script[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[\s\S]*?<\/style>/gi, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
  const excerpt = cleaned.split('. ').slice(0,2).join('. ').slice(0,200).trim();
  return { title, excerpt };
}

(function main(){
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log('No articles directory found. Creating one.');
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }

  const files = fs.readdirSync(ARTICLES_DIR)
    .filter(f => /\.html?$/i.test(f))
    .map(f => {
      const stat = fs.statSync(path.join(ARTICLES_DIR, f));
      return { name: f, mtime: stat.mtimeMs };
    })
    .sort((a,b) => b.mtime - a.mtime); // newest first

  const list = files.map(file => {
    const full = fs.readFileSync(path.join(ARTICLES_DIR, file.name), 'utf8');
    const { title, excerpt } = readTitleAndExcerpt(full);
    const stat = fs.statSync(path.join(ARTICLES_DIR, file.name));
    const date = new Date(stat.mtime).toISOString().slice(0,10);
    return {
      title: title || file.name.replace(/\.html?$/i,''),
      file: file.name,
      date,
      excerpt: excerpt || ''
    };
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), 'utf8');
  console.log('✅ article-list.json generated. total:', list.length);
})();