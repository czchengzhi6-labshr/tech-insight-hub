const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function generateArticle() {
  const articlePrompt = `
Write a high-quality, original English technology article (1000–1500 words).
Style: futuristic, informative, scientific.
Insert an advertisement placeholder like this:

---ADVERTISEMENT-BLOCK---

Do NOT wrap output in code fences.
  `;

  const response = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are an expert technology columnist." },
        { role: "user", content: articlePrompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}

async function generateCover() {
  const imageUrl = "https://picsum.photos/1200/630";
  const imgBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

  if (!fs.existsSync("covers")) fs.mkdirSync("covers");

  const fileName = `cover_${Date.now()}.jpg`;
  fs.writeFileSync(path.join("covers", fileName), imgBuffer);

  return fileName;
}

(async () => {
  if (!fs.existsSync("articles")) fs.mkdirSync("articles");

  const articleText = await generateArticle();
  const coverFile = await generateCover();

  const articleFile = `article_${Date.now()}.html`;

  const html = `
<html><head><meta charset="UTF-8"><title>Tech Article</title></head><body>
<div class="container">
<img src="../covers/${coverFile}" style="width:100%; border-radius:12px;">
<h1>AI Generated Tech Article</h1>
${articleText.replace(/\n/g, "<br>")}
<br><br>
<div class="ad">AD SPACE</div>
</div>
</body></html>
`;

  fs.writeFileSync(path.join("articles", articleFile), html);

  // 更新文章列表
  let list = [];
  if (fs.existsSync("article-list.json")) {
    try { list = JSON.parse(fs.readFileSync("article-list.json")); } catch (e) {}
  }

  list.push({
    title: "AI Tech Article",
    file: articleFile,
    cover: coverFile,
    timestamp: Date.now()
  });

  fs.writeFileSync("article-list.json", JSON.stringify(list, null, 2));

  console.log("✔ Article + cover saved");
})();
