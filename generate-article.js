const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ---- CONFIG ----
const REPO = process.env.GITHUB_REPOSITORY;
const TOKEN = process.env.GITHUB_TOKEN;
const API_KEY = process.env.DEEPSEEK_API_KEY;

function generateId() {
    return crypto.randomBytes(8).toString("hex");
}

// ---- CALL DEEPSEEK API ----
async function generateArticle() {
    const prompt = `
Write an 800-word English technology article. 
The article should be insightful, professional, and suitable for a tech website.
Topics could include AI, robotics, cloud computing, cybersecurity, or emerging technologies.
Do NOT add HTML—only pure text content with section titles.
`;

    try {
        const res = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 2000,
                temperature: 0.7
            },
            { headers: { Authorization: `Bearer ${API_KEY}` } }
        );

        return res.data.choices[0].message.content.trim();

    } catch (err) {
        console.error("❌ DeepSeek API ERROR:", err.response?.data || err);
        throw err;
    }
}

// ---- HTML TEMPLATE ----
function generateHTML(title, content, id) {
    const coverUrl = `https://source.unsplash.com/random/1200x600/?technology,AI,software`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>

<style>
    body {
        font-family: Arial, sans-serif;
        background: #f2f4f8;
        margin: 0;
        padding: 0;
    }
    .container {
        max-width: 900px;
        background: white;
        margin: 40px auto;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
    }
    h1 {
        margin-top: 0;
        font-size: 32px;
    }
    img.cover {
        width: 100%;
        border-radius: 12px;
        margin: 20px 0;
    }
    .meta {
        color: #555;
        font-size: 14px;
        margin-bottom: 20px;
    }
    .ad-box {
        padding: 18px;
        margin: 25px 0;
        background: #fff4d6;
        border: 1px solid #f2d28b;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
        color: #7a5a00;
    }
    .content {
        font-size: 18px;
        line-height: 1.8;
        white-space: pre-line;
    }
</style>
</head>

<body>

<div class="container">

    <h1>${title}</h1>

    <img src="${coverUrl}" class="cover" alt="cover image">

    <p class="meta">Views: <span id="views">Loading...</span></p>

    <div class="ad-box">
        🔔 Advertisement Space — Your Ad Can Be Here
    </div>

    <div class="content">
${content}
    </div>

    <div class="ad-box">
        🔔 Sponsored — Contact us for ad placement
    </div>

</div>

<script>
// load + update view count
fetch("https://raw.githubusercontent.com/${REPO}/main/view-count.json")
  .then(r => r.json())
  .then(data => {
    if (!data["${id}"]) data["${id}"] = 0;
    data["${id}"]++;
    document.getElementById("views").textContent = data["${id}"];

    fetch("https://api.github.com/repos/${REPO}/contents/view-count.json", {
      method: "PUT",
      headers: {
        "Authorization": "token ${TOKEN}",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update view count",
        content: btoa(JSON.stringify(data, null, 2)),
        sha: undefined
      })
    });
  });
</script>

</body>
</html>`;
}

// ---- MAIN WORKFLOW ----
async function main() {
    console.log("🚀 Generating new tech article...");

    const rawText = await generateArticle();

    const title = rawText.split("\n")[0].replace(/^#+\s*/, "").trim();
    const id = generateId();
    const filename = `${id}.html`;

    const html = generateHTML(title, rawText, id);

    // Ensure articles folder exists
    const articlesDir = path.join(__dirname, "articles");
    if (!fs.existsSync(articlesDir)) fs.mkdirSync(articlesDir);

    // Save HTML article
    fs.writeFileSync(path.join(articlesDir, filename), html);
    console.log("📄 Article saved:", filename);

    // Update article-list.json
    const listPath = path.join(__dirname, "article-list.json");
    let list = [];

    if (fs.existsSync(listPath)) {
        list = JSON.parse(fs.readFileSync(listPath));
    }

    list.unshift({ id, title, file: filename });

    fs.writeFileSync(listPath, JSON.stringify(list, null, 2));
    console.log("📚 Updated article-list.json");
}

main();