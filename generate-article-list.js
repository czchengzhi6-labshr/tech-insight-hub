/**
 * generate-article-list.js
 * - 扫描 ./articles/*.html
 * - 提取 <h1> 作为标题（若找不到用文件名）
 * - 生成 article-list.json
 */

const fs = require("fs");
const path = require("path");

const ARTICLES_DIR = path.join(process.cwd(), "articles");
const OUT_FILE = path.join(process.cwd(), "article-list.json");

function readTitleFromHtml(content) {
  const m = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (m) return m[1].replace(/<[^>]+>/g, "").trim();
  return null;
}

function listArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => /\.html?$/.test(f));
  files.sort(); // 按文件名排序，必要时可改为按时间
  const arr = files.map(f => {
    const full = path.join(ARTICLES_DIR, f);
    const content = fs.readFileSync(full, "utf8");
    const title = readTitleFromHtml(content) || f;
    const stat = fs.statSync(full);
    const date = stat.mtime.toISOString().slice(0,10);
    return {
      title: title,
      url: `/articles/${f}`,
      date
    };
  });
  return arr;
}

(function() {
  const list = listArticles();
  fs.writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), "utf8");
  console.log("Wrote article list:", OUT_FILE);
})();