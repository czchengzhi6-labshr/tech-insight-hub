// generate-article.js
// Auto-generate technology articles in English using DeepSeek API.
// Output HTML with built-in ad slots.

const fs = require("fs");
const path = require("path");
const https = require("https");

// ====== SETTINGS ======
const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing DEEPSEEK_API_KEY in GitHub Secrets");
  process.exit(1);
}

const ARTICLES_DIR = path.join(process.cwd(), "articles");
if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR);

// ====== AI REQUEST FUNCTION ======
function callDeepSeek(prompt) {
  const data = JSON.stringify({
    model: "deepseek-chat",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.9
  });

  const options = {
    hostname: "api.deepseek.com",
    port: 443,
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Length": data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json.choices[0].message.content);
        } catch (e) {
          reject("Invalid JSON: " + body);
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ====== ARTICLE TEMPLATE ======
function wrapHTML(title, content) {
  const ad1 = `<script>(function(s){s.dataset.zone='10258891',s.src='https://groleegni.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`;
  const ad2 = `<script src="https://quge5.com/88/tag.min.js" data-zone="189330" async data-cfasync="false"></script>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
body { max-width: 780px; margin: auto; font-family: Arial; line-height: 1.6; padding: 20px; }
h1 { margin-bottom: 20px; }
.ad { margin: 25px 0; }
</style>
</head>
<body>
<h1>${title}</h1>

<div class="ad">${ad1}</div>

${content}

<div class="ad">${ad2}</div>

</body>
</html>`;
}

// ====== MAIN ======
async function main() {
  console.log("🚀 Generating tech article...");
  const prompt = `
Write an 800-word technology article in English.
The topic should be related to AI, robotics, chips, cybersecurity, cloud computing or future tech.
Write in a clear, professional tone, with Markdown headings.
Do NOT include code unless necessary.
  `;

  let text;
  try {
    text = await callDeepSeek(prompt);
  } catch (err) {
    console.error("AI request failed:", err);
    process.exit(1);
  }

  const titleMatch = text.match(/#+\s*(.*)/);
  const title = titleMatch ? titleMatch[1].trim() : "Tech Insight";

  const filename = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".html";
  const filepath = path.join(ARTICLES_DIR, filename);

  const html = wrapHTML(title, text.replace(/\n/g, "<br>"));

  fs.writeFileSync(filepath, html, "utf8");
  console.log("✅ Article generated:", filename);
}

main();