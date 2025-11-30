name: Auto Generate & Publish Article

on:
  workflow_dispatch: {}
  schedule:
    - cron: "0 */6 * * *" # 每6小时一次（按需修改）

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          # 如果你在 package.json 指定了依赖，使用 npm ci 更稳定
          if [ -f package-lock.json ]; then npm ci; else npm install; fi

      - name: Run generate-article (create article files)
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}   # 或你的AI KEY
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }} # 如果你的脚本用到了其他API
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: |
          echo "Running generate-article.js"
          node ./generate-article.js

      - name: Generate article list
        run: |
          echo "Running generate-article-list.js"
          node ./generate-article-list.js

      - name: Commit & Push changes
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -A
          if git diff --cached --quiet; then
            echo "No changes to commit"
          else
            git commit -m "chore: auto generate article(s) and update list [ci skip]" || echo "commit failed"
            git push origin HEAD:${{ github.ref_name }}
          fi