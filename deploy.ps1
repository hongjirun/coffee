# 咖啡店后台管理系统部署脚本
# 使用方式: 在 PowerShell 中运行 .\deploy.ps1

$serverIP = "8.134.18.95"
$serverUser = "root"
$remotePath = "/www/wwwroot/admin.xianshihuodong.xyz"
$localDist = "d:\开发软件AI\凌小巧的咖啡店\admin\dist"

Write-Host "🚀 开始部署到服务器 $serverIP..." -ForegroundColor Green

# 检查 dist 文件夹是否存在
if (-not (Test-Path $localDist)) {
    Write-Host "❌ 错误: dist 文件夹不存在，请先运行 npm run build" -ForegroundColor Red
    exit 1
}

# 方法1: 使用 scp (需要安装 OpenSSH)
Write-Host "📦 正在上传文件到服务器..." -ForegroundColor Yellow

try {
    # 删除远程旧文件
    Write-Host "🗑️ 清理远程旧文件..."
    ssh ${serverUser}@${serverIP} "rm -rf ${remotePath}/*"
    
    # 上传新文件
    Write-Host "📤 上传新文件..."
    scp -r "${localDist}\*" "${serverUser}@${serverIP}:${remotePath}/"
    
    Write-Host "✅ 部署成功！" -ForegroundColor Green
    Write-Host "🌐 访问地址: https://admin.xianshihuodong.xyz" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 部署失败: $_" -ForegroundColor Red
    Write-Host "💡 请确保:" -ForegroundColor Yellow
    Write-Host "   1. 已安装 OpenSSH 客户端" -ForegroundColor Yellow
    Write-Host "   2. 服务器SSH密钥已配置，或手动输入密码" -ForegroundColor Yellow
    Write-Host "   3. 网络连接正常" -ForegroundColor Yellow
}
