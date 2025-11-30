// generate-article.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * 注意：本脚本只在 CI (GitHub Actions) 中执行，绝对不要把 secrets 写入最终生成的 HTML。
 * 在仓库 Settings -> Secrets 中设置 DEEPSEEK_API_KEY 或你的 AI KEY
 */

const OUT_DIR = path.join(process.cwd(), 'articles');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function callAI(prompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('Missing DEEPSEEK_API_KEY secret');

  // 根据你的 API 替换 URL / body
  const resp = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 1200
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60 * 1000
    }
  );

  // 适配返回路径
  return resp.data?.choices?.[0]?.message?.content || '';
}

function sanitizeFileName(title) {
  return title.trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .substring(0, 80) + '.html';
}

// 生成 HTML 模板（注意：不写任何 token 到文件中）
function buildHtml(title, contentHtml) {
  const cover = `https://source.unsplash.com/random/1200x600/?technology,ai`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/style.css" />
</head>
<body>
<nav><!-- 你站点的导航可以保持一致 --></nav>

<main class="container">
  <article>
    <h1>${escapeHtml(title)}</h1>
    <img src="${cover}" alt="${escapeHtml(title)}" style="width:100%;border-radius:8px;margin:20px 0;" />
    <p>阅读量：<span id="views">--</span></p>

    <div class="content">
      ${contentHtml}
    </div>
  </article>
</main>

<footer><!-- footer --></footer>

<!-- 说明：页面不用写任何密钥，也不要尝试从页面直接修改仓库 -->
</body>
</html>`;
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

function mdToHtml(mdText) {
  // 简易转换：换行 -> p，或者你可以用 marked 等库（但需在 package.json 列出）
  // 这里做非常基础的处理：把 Markdown 的标题/段落转换为 HTML
  let html = mdText
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n{2,}/g, '</p><p>')
    ;

  // wrap with <p>
  if (!html.startsWith('<p>')) html = '<p>' + html + '</p>';
  return html;
}

(async () => {
  try {
    const prompt = `请写一篇中文技术文章，主题：人工智能的最新趋势。包含标题、若干小节，每个小节有段落，适合发布到博客。长度大约 600-900 字。不要在输出中包含任何 API keys、代码块或私人信息。`;
    const aiText = await callAI(prompt);

    // 尝试从返回中解析标题（如果 AI 返回 Markdown 的 "# 标题"）
    let title = (aiText.match(/^#\s*(.+)/m) || aiText.match(/^(.+)\n/))[1] || '未命名文章';
    title = title.trim();

    const fileName = sanitizeFileName(title);
    const filePath = path.join(OUT_DIR, fileName);

    const htmlContent = buildHtml(title, mdToHtml(aiText.replace(/^#\s*.+/m, '').trim()));

    fs.writeFileSync(filePath, htmlContent, 'utf-8');
    console.log('Generated article:', filePath);
  } catch (err) {
    console.error('Error generating article:', err.message || err);
    process.exit(1);
  }
})();