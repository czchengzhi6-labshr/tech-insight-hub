const fs = require("fs");
const path = require("path");

// ======= 1. 获取输入内容 =======
const title = process.argv[2] || "未命名文章";
const content = process.argv[3] || "（内容为空）";

// ======= 2. 时间与文件名 =======
const now = new Date();
const dateStr = now.toISOString().split("T")[0];    // YYYY-MM-DD
const articleId = now.getTime();                    // 唯一 ID
const fileName = `${articleId}.html`;               // 如 1735678912345.html
const filePath = path.join("articles", fileName);

// ======= 3. 生成 HTML 内容 =======
const html = `
<!DOCTYPE html>
<html lang="zh-cn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="../styles/article.css" />
</head>
<body>
  <h1>${title}</h1>
  <p class="date">发布时间：${dateStr}</p>
  <div class="content">
    ${content.replace(/\n/g, "<br>")}
  </div>

  <script>
    // 阅读计数 API (GitHub raw JSON)
    fetch("https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/main/view-count.json")
      .then(r => r.json())
      .then(data => {
        data["${articleId}"] = (data["${articleId}"] || 0) + 1;
        fetch("https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/view-count.json", {
          method: "PUT",
          headers: {
            "Authorization": "Bearer ${process.env.GITHUB_TOKEN}",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "update view count",
            content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
            sha: "${process.env.VIEWCOUNT_SHA}"
          })
        });
      });
  </script>
</body>
</html>
`;

// ======= 4. 写入 HTML 文件 =======
if (!fs.existsSync("articles")) fs.mkdirSync("articles");
fs.writeFileSync(filePath, html, "utf-8");

console.log(`已生成文章: ${filePath}`);


// ======= 5. 更新 article-list.json =======
const listPath = "article-list.json";
let list = [];

// 如果存在则读取旧文件
if (fs.existsSync(listPath)) {
  list = JSON.parse(fs.readFileSync(listPath, "utf-8"));
}

// 插入最新文章到最前面
list.unshift({
  id: articleId,
  title: title,
  file: fileName,
  date: dateStr
});

// 写回 JSON
fs.writeFileSync(listPath, JSON.stringify(list, null, 2), "utf-8");
console.log("已更新 article-list.json");


// ======= 6. 阅读计数文件不存在则创建 =======
const viewPath = "view-count.json";
if (!fs.existsSync(viewPath)) {
  fs.writeFileSync(viewPath, JSON.stringify({}, null, 2));
  console.log("已创建 view-count.json");
}

console.log("文章生成流程完成 ✓");