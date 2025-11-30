const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function generateArticle() {
  console.log("📝 Generating tech-style article...");

  const articlePrompt = `
Write a high-quality, original English technology article (1000–1500 words).
Style: futuristic, informative, scientific.
Include one placeholder for advertisement:

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
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}

async function generateCover() {
  console.log("🎨 Generating cover image...");

  const imageUrl = "https://picsum.photos/1200/630";
  const imgBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

  const fileName = `cover_${Date.now()}.jpg`;
  const filePath = path.join("covers", fileName);

  fs.writeFileSync(filePath, imgBuffer);
  return fileName;
}

async function main() {
  if (!fs.existsSync("articles")) fs.mkdirSync("articles");
  if (!fs.existsSync("covers")) fs.mkdirSync("covers");

  const articleText = await generateArticle();
  const coverFile = await generateCover();

  const articleFile = `article_${Date.now()}.html`;

  const html = `
<html>
<head>
  <meta charset="UTF-8">
  <title>Tech Article</title>
  <style>
    body { font-family: Arial; padding: 20px; max-width: 900px; margin: auto; }
    img { border-radius: 12px; }
    .ad { margin-top: 40px; padding: 20px; background: #eee; text-align: center; }
  </style>
</head>
<body>
<img src="../covers/${coverFile}" style="width:100%;">

<h1>AI Generated Tech Article</h1>

${articleText.replace(/\n/g, "<br>")}

<div class="ad">AD SPACE</div>

</body>
</html>
  `;

  fs.writeFileSync(path.join("articles", articleFile), html);

  let list = [];
  if (fs.existsSync("article-list.json")) {
    list = JSON.parse(fs.readFileSync("article-list.json"));
  }

  list.push({
    title: "AI Tech Article",
    file: articleFile,
    cover: coverFile,
    timestamp: Date.now()
  });

  fs.writeFileSync("article-list.json", JSON.stringify(list, null, 2));

  console.log("✔ Article + cover saved");
}

main();
