# 凌小巧咖啡店 - 完整部署脚本
# 使用方式: 在 PowerShell 中运行 .\deploy.ps1

$serverIP = "8.134.18.95"
$serverUser = "root"
$serverPassword = "JR2904536462.."  # 服务器密码

$projectRoot = "c:\Users\Lenovo\Desktop\coffee"
$adminDist = "$projectRoot\admin\dist"
$serverPath = "$projectRoot\server"

$remoteAdminPath = "/www/wwwroot/admin.xianshihuodong.xyz"
$remoteServerPath = "/www/wwwroot/coffee-api"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ☕ 凌小巧咖啡店 - 线上同步部署" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ========== 步骤 1: 构建后台管理前端 ==========
Write-Host "� 步骤 1: 构建后台管理前端..." -ForegroundColor Yellow

Set-Location "$projectRoot\admin"

# 设置线上 API 地址并构建
$env:VITE_API_URL = "https://api.xianshihuodong.xyz/api"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install 失败" -ForegroundColor Red
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 后台管理构建完成" -ForegroundColor Green

# ========== 步骤 2: 使用 SCP 同步后端代码 ==========
Write-Host ""
Write-Host "�️ 步骤 2: 同步后端代码到服务器..." -ForegroundColor Yellow

# 检查是否安装了 scp
$scp = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scp) {
    Write-Host "⚠️ 未找到 scp 命令，请安装 OpenSSH 客户端" -ForegroundColor Yellow
    Write-Host "   或者使用 WinSCP 等工具手动上传" -ForegroundColor Yellow
}

# 创建临时排除文件列表 (排除 node_modules 和 .env)
$excludeFile = "$env:TEMP\scp_exclude.txt"
"node_modules" | Out-File -FilePath $excludeFile -Encoding UTF8
".env" | Out-File -FilePath $excludeFile -Encoding UTF8 -Append
".git" | Out-File -FilePath $excludeFile -Encoding UTF8 -Append

Write-Host "� 正在上传后端代码..." -ForegroundColor Yellow
# 使用 scp 上传 server 目录（排除 node_modules）
scp -r "$serverPath\*" "${serverUser}@${serverIP}:${remoteServerPath}/"

Write-Host "✅ 后端代码同步完成" -ForegroundColor Green

# ========== 步骤 3: 同步前端 dist 文件 ==========
Write-Host ""
Write-Host "🌐 步骤 3: 同步后台管理前端..." -ForegroundColor Yellow

# 清空远程目录并上传
ssh "${serverUser}@${serverIP}" "rm -rf ${remoteAdminPath}/*"
scp -r "$adminDist\*" "${serverUser}@${serverIP}:${remoteAdminPath}/"

Write-Host "✅ 前端同步完成" -ForegroundColor Green

# ========== 步骤 4: 在服务器上重启后端服务 ==========
Write-Host ""
Write-Host "🔄 步骤 4: 重启后端服务..." -ForegroundColor Yellow

ssh "${serverUser}@${serverIP}" @"
cd ${remoteServerPath}
npm install --production
pm2 restart coffee-api
pm2 save
"@

Write-Host "✅ 后端服务已重启" -ForegroundColor Green

# ========== 部署完成 ==========
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ 部署完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 访问地址:" -ForegroundColor Cyan
Write-Host "   管理后台: https://admin.xianshihuodong.xyz" -ForegroundColor White
Write-Host "   API 地址: https://api.xianshihuodong.xyz" -ForegroundColor White
Write-Host ""
Write-Host "📱 小程序:" -ForegroundColor Cyan
Write-Host "   请使用微信开发者工具打开 miniprogram/ 目录" -ForegroundColor White
Write-Host "   然后点击'上传'按钮提交审核" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  注意:" -ForegroundColor Yellow
Write-Host "   1. 确保已添加小程序服务器域名:" -ForegroundColor Yellow
Write-Host "      - request合法域名: https://api.xianshihuodong.xyz" -ForegroundColor Yellow
Write-Host "      - uploadFile合法域名: https://api.xianshihuodong.xyz" -ForegroundColor Yellow
Write-Host "   2. 登录后台后请修改默认密码" -ForegroundColor Yellow
