#!/bin/bash
# DSLP 一键环境搭建脚本（Linux版）
# 请在项目根目录运行：bash setup-linux.sh

set -e

# 1. 安装 Node.js（建议 18+）
if ! command -v node >/dev/null; then
  echo "请先安装 Node.js 18+，可参考 https://nodejs.org/en/download/"
  exit 1
fi

# 2. 安装 MongoDB（建议 5+）
if ! command -v mongod >/dev/null; then
  echo "请先安装 MongoDB，参考 https://www.mongodb.com/try/download/community"
  exit 1
fi

# 3. 安装依赖
npm install
cd front && npm install && cd ../back && npm install && cd ..

# 4. 启动 MongoDB（后台运行）
if ! pgrep mongod >/dev/null; then
  echo "尝试启动 MongoDB..."
  mongod --dbpath ./back/data/db --logpath ./back/data/mongo.log --fork || echo "请手动启动 MongoDB"
fi

# 5. 初始化数据库（可选）
cd back
npm run build:source:hardcoded || true
npm run init:dslp:from-source -- --mode=replace --db=dslp || true
npm run validate:envelope:content || true
npm run import:hardcoded || true
npm run migrate:envelope:content || true
npm run seed:quiz:sample || true
npm run seed:quiz:from-theory || true
npm run seed:oj:default || true
cd ..

# 6. 构建前端
cd front
npm run build
cd ..

# 7. 构建后端
cd back
npm run build
cd ..

# 8. 启动服务（开发模式）
# 前端: http://localhost:5178
# 后端: http://localhost:3001/api
# 如需生产部署请参考 Nginx 配置

# 推荐用 tmux 或 pm2 分别启动
# tmux new -s dslp
# cd front && npm run dev
# cd ../back && npm run dev

echo "环境搭建完成！"
echo "前端: http://localhost:5178"
echo "后端: http://localhost:3001/api"
echo "如需局域网/域名访问，请参考系统功能与运行步骤文档"
