// generate-article.js
// 完整最终版（含广告 / HTML 结构优化 / AI 内容生成）

import fs from "fs";
import path from "path";
import { ChatGPTAPI } from "chatgpt";

// 你的 API 密钥从环境变量获取
const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY
});

function getDateString() {
    const now = new Date();
    return now.toISOString().split("T")[0];
}

async function generateArticle() {
    console.log("🚀 Starting article generation...");

    // 1. 调用 GPT 生成文章
    const prompt = `
Generate an 800-word original English technology article. 
Requirements:
- Topic: the latest emerging technologies
- Style: professional, clear, reader-friendly
- Include insights, examples, and analysis
- Do NOT include ads. Just pure article content.
    `;

    console.log("🧠 Asking ChatGPT for article content...");

    const res = await api.sendMessage(prompt);
    const content = res.text;

    // 第一段作为标题
    const title = content.split("\n")[0].replace(/^#+\s*/, "").trim();
    const date = getDateString();

    console.log("📄 Title generated:", title);

    // HTML 模板（含你的两个广告）
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.7; padding: 20px; max-width: 800px; margin: auto;">

    <!-- === Top AD: Monetag === -->
    <div style="margin: 20px 0;">
        <script>
            (function(s){
                s.dataset.zone='10258891';
                s.src='https://groleegni.net/vignette.min.js';
            })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))
        </script>
    </div>

    <h1>${title}</h1>
    <p><em>${date}</em></p>

    <div id="content">
        ${content.replace(/\n/g, "<br><br>")}
    </div>

    <!-- === Mid AD: quge5 === -->
    <div style="margin: 30px 0;">
        <script src="https://quge5.com/88/tag.min.js"
            data-zone="189330"
            async data-cfasync="false"></script>
    </div>

    <!-- === Bottom expandable AD slot === -->
    <div style="margin: 30px 0;">
        <!-- You may add more ads here -->
    </div>

</body>
</html>
`;

    // 保存路径
    const fileName = `${date}-${title.replace(/[^a-zA-Z0-9]+/g, "-")}.html`;
    const folder = "./articles";
    const savePath = path.join(folder, fileName);

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }

    fs.writeFileSync(savePath, html);

    console.log(`✅ Article successfully created: ${savePath}`);
}

generateArticle().catch(err => {
    console.error("❌ Error generating article:", err);
});