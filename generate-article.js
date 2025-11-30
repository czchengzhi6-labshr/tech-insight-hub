const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");

// =============== 随机封面图生成 ===============
function getRandomCover() {
  const topics = ["technology", "ai", "coding", "software", "computer"];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  return `https://source.unsplash.com/random/1200x600/?${topic}`;
}

// =============== 随机广告位 ===============
function getAdHtml() {
  return `
  <div class="ad-box" style="padding:15px; border:1px solid #ccc; margin:20px 0; text-align:center;">
    <p>🔔 广告位 | 你的广告可以放这里</p>
  </div>
  `;
}

// =============== 自动生成阅读量 key ===============
function generateArticleId() {
  return crypto.randomBytes(8).toString("hex"); // 唯一 ID 用于记录阅读量
}

// =============== 生成文章 ===============
async function generateArticle() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  const prompt = "写一篇有关最新科技趋势的技术文章，段落清晰，含标题。";

  const article = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "system", content: prompt }]
    },
    {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  const text = article.data.choices[0].message.content;

  const title = text.match(/^#\s*(.*)/)?.[1] || "未命名文章";
  const fileName = title.replace(/\s+/g, "-").replace(/[^\w-]/g, "") + ".html";
  const filePath = path.join("articles", fileName);

  const articleId = generateArticleId();   // 用于阅读量统计
  const cover = getRandomCover();         // 封面图

  const htmlContent = `
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link rel="stylesheet" href="../style.css" />
</head>
<body>

<h1>${title}</h1>

<img src="${cover}" class="cover-image" style="width:100%;border-radius:8px;margin:20px 0;" />

<p>阅读量：<span id="views">加载中...</span></p>

${getAdHtml()}

<div class="content">
${text.replace(/^#\s*(.*)/, "")}
</div>

${getAdHtml()}

<script>
// 记录阅读量
fetch("https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/main/view-count.json")
  .then(r => r.json())
  .then(data => {
    if (!data["${articleId}"]) data["${articleId}"] = 0;
    data["${articleId}"]++;

    document.getElementById("views").textContent = data["${articleId}"];

    // 推送更新（触发 workflow）
    fetch("https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/view-count.json", {
      method: "PUT",
      headers: {
        "Authorization": "token ${process.env.GITHUB_TOKEN}",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update view count",
        content: btoa(JSON.stringify(data, null, 2)),
        sha: "${process.env.VIEW_COUNT_SHA}"
      })
    });
  });
</script>

${getAdHtml()}

</body>
</html>
`;

  fs.writeFileSync(filePath, htmlContent, "utf-8");
  console.log("文章已生成:", filePath);

  return { fileName, articleId, title };
}

generateArticle();
