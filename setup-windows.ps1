# DSLP 一键环境搭建脚本（Windows版）
# 请在项目根目录运行：powershell -ExecutionPolicy Bypass -File setup-windows.ps1
<#
1. 检查 Node.js
2. 检查 MongoDB
3. 检查 Docker（OJ 沙箱判题需要）
#>

# 1. 检查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "请先安装 Node.js 18+，参考 https://nodejs.org/en/download/"
    exit 1
}

 # 2. 检查 MongoDB
# 3. 检查 Docker（OJ 沙箱判题需要）
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "未检测到 Docker，OJ 判题功能需要 Docker 环境。请参考 https://docs.docker.com/get-docker/ 安装。"
} else {
    Write-Host "检测到 Docker，建议构建 OJ 沙箱镜像："
    Write-Host "  bash back/docker/build-all.sh"
}
if (-not (Get-Command mongod -ErrorAction SilentlyContinue)) {
    Write-Host "请先安装 MongoDB，参考 https://www.mongodb.com/try/download/community"
    exit 1
}

# 3. 安装依赖
Write-Host "安装依赖..."
npm install
Set-Location front; npm install; Set-Location ../back; npm install; Set-Location ..

# 4. 启动 MongoDB（后台）
if (-not (Get-Process mongod -ErrorAction SilentlyContinue)) {
    Write-Host "尝试启动 MongoDB..."
    Start-Process mongod -ArgumentList "--dbpath ./back/data/db --logpath ./back/data/mongo.log" -WindowStyle Hidden
    Start-Sleep -Seconds 5
}

# 5. 初始化数据库（可选）
Set-Location back
npm run build:source:hardcoded
npm run init:dslp:from-source -- --mode=replace --db=dslp
npm run validate:envelope:content
npm run import:hardcoded
npm run migrate:envelope:content
npm run seed:quiz:sample
npm run seed:quiz:from-theory
npm run seed:oj:default
Set-Location ..

# 6. 构建前端
Set-Location front
npm run build
Set-Location ..

# 7. 构建后端
Set-Location back
npm run build
Set-Location ..

# 8. 启动服务（开发模式）
Write-Host "------"
Write-Host "如需 OJ 判题功能，请确保已安装 Docker 并构建沙箱镜像（bash back/docker/build-all.sh）"
Write-Host "如需性能/健壮性测试，请参考 script/performance-test.js、script/robustness-test.js"
Write-Host "------"
Write-Host "环境搭建完成！"
Write-Host "前端: http://localhost:5178"
Write-Host "后端: http://localhost:3001/api"
Write-Host "如需局域网/域名访问，请参考系统功能与运行步骤文档"
