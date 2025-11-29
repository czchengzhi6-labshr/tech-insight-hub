const fs = require("fs");
const path = require("path");
const articlesDir = path.join(__dirname, "articles");
const outputFile = path.join(__dirname, "article-list.json");

function getTitleFromHTML(filePath) {
    let html = fs.readFileSync(filePath, "utf8");
    let match = html.match(/<title>(.*?)<\/title>/i);

    return match ? match[1] : path.basename(filePath, ".html");
}

function getFileModifiedDate(filePath) {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split("T")[0];
}

function generateArticleList() {
    let files = fs.readdirSync(articlesDir).filter(f => f.endsWith(".html"));

    let list = files.map(file => {
        const fullPath = path.join(articlesDir, file);
        return {
            title: getTitleFromHTML(fullPath),
            url: "/articles/" + file,
            date: getFileModifiedDate(fullPath)
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(list, null, 4));
    console.log("article-list.json 已自动生成！");
}

generateArticleList();
