/**
 * generate-article.js
 * - 从环境变量读取 DEEPSEEK_API_KEY
 * - 调用 DeepSeek（或替换为你实际的 AI 接口）
 * - 生成一个 HTML 文件到 ./articles/
 *
 * 注意：不要在生成的 HTML 中写入任何密钥或 token（会被 secret scanning 阻止 push）。
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ARTICLES_DIR = path.join(process.cwd(), "articles");

// helper: 生成安全文件名
function safeFileName(title) {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-\.]/g, "")
    .substring(0, 120);
}

async function callAI(prompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set in env");

  // 调用 DeepSeek 示例 —— 如果你用别的模型，替换 URL 和请求体
  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一个技术文章写作助手。" },
        { role: "user", content: prompt }
      ],
      max_tokens: 1200
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 30000
    }
  );

  // 根据 API 返回结构取出文本（请根据实际 API 调整）
  const text = res.data?.choices?.[0]?.message?.content || "";
  return text;
}

function getRandomCover() {
  const topics = ["technology", "ai", "coding", "software", "computer"];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  return `https://source.unsplash.com/random/1200x600/?${topic}`;
}

(async () => {
  try {
    if (!fs.existsSync(ARTICLES_DIR)) {
      fs.mkdirSync(ARTICLES_DIR, { recursive: true });
    }

    // Prompt，可以根据需要自定义
    const prompt = `请写一篇200-600字的技术类短文，包含中文标题（前面用 # 标注），段落清晰，适合发布在博客。结尾带一小段“作者总结”。`;

    const aiText = await callAI(prompt);

    // 尝试从文本中取标题（以 "# 标题" 为准），没有则用默认
    const titleMatch = aiText.match(/^#\s*(.*)/m);
    const title = titleMatch ? titleMatch[1].trim() : ("技术短文 " + new Date().toISOString());

    const fileBase = safeFileName(title);
    const fileName = `${fileBase}.html`;
    const filePath = path.join(ARTICLES_DIR, fileName);

    const cover = getRandomCover();

    // 把 AI 返回的内容（可能包含 Markdown #）转换为简单 HTML（很基础）
    const bodyHtml = aiText
      .replace(/^#\s.*$/m, "")                    // 去掉标题行
      .split(/\n{2,}/)                            // 段落分割
      .map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");

    const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<link rel="stylesheet" href="/style.css" />
</head>
<body>
<main style="max-width:900px;margin:30px auto;padding:0 16px;">
  <h1>${title}</h1>
  <img src="${cover}" alt="cover" style="width:100%;border-radius:8px;margin:16px 0;" />
  <p style="color:#666">发布时间：${new Date().toISOString().slice(0,10)}</p>
  <article>${bodyHtml}</article>
</main>
</body>
</html>`;

    fs.writeFileSync(filePath, html, { encoding: "utf8" });
    console.log("Generated article:", filePath);

    // 输出信息给 workflow 使用（stdout 里返回文件名）
    console.log(JSON.stringify({ file: `articles/${fileName}`, title: title }));
    process.exit(0);
  } catch (err) {
    console.error("Error generate article:", err.message || err);
    process.exit(2);
  }
})();