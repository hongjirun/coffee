# 凌小巧咖啡店 - 阿里云部署指南

## 目录结构

```
凌小巧的咖啡店/
├── server/          # Node.js 后端 API
├── admin/           # Vue3 后台管理前端
└── miniprogram/     # 微信小程序
```

---

## 一、服务器环境准备（阿里云 ECS）

```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL 8.0
sudo apt-get install -y mysql-server
sudo mysql_secure_installation

# 安装 PM2 (进程守护)
npm install -g pm2

# 安装 Nginx
sudo apt-get install -y nginx
```

---

## 二、数据库初始化

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source /path/to/server/src/db/init.sql;
```

---

## 三、后端 API 部署

```bash
cd /var/www/coffee-shop/server

# 复制环境配置
cp .env.example .env
# 编辑 .env 填写数据库密码、JWT密钥等
nano .env

# 安装依赖
npm install --production

# 用 PM2 启动
pm2 start src/app.js --name coffee-api
pm2 save
pm2 startup
```

---

## 四、前端后台构建部署

```bash
cd /var/www/coffee-shop/admin

# 安装依赖
npm install

# 修改生产环境API地址（vite.config.js proxy 仅开发用）
# 在 src/api/index.js 中确认 baseURL 为 '/api'

# 构建
npm run build

# dist/ 目录就是静态文件，配置 Nginx 指向它
```

---

## 五、Nginx 配置

假设你的子域名为 `admin.your-domain.com`

```nginx
# /etc/nginx/sites-available/coffee-shop

# 后台管理系统
server {
    listen 80;
    server_name admin.your-domain.com;

    root /var/www/coffee-shop/admin/dist;
    index index.html;

    # Vue Router history 模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到 Node.js
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传图片静态访问
    location /uploads {
        proxy_pass http://127.0.0.1:3000;
    }
}

# API 服务（小程序直接调用）
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/coffee-shop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 六、配置 HTTPS（必须，微信小程序要求）

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 申请证书（替换为你的域名）
sudo certbot --nginx -d admin.your-domain.com -d api.your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
```

---

## 七、微信小程序配置

1. 打开 `miniprogram/app.js`，将 `BASE_URL` 改为你的 API 地址：
   ```js
   const BASE_URL = 'https://api.your-domain.com/api'
   ```

2. 在微信公众平台 → 开发管理 → 开发设置 → 服务器域名，添加：
   - `request合法域名`: `https://api.your-domain.com`
   - `uploadFile合法域名`: `https://api.your-domain.com`

3. 将 `miniprogram/project.config.json` 中的 `appid` 替换为你的真实 AppID

4. 使用微信开发者工具打开 `miniprogram/` 目录，测试并上传

---

## 八、默认账号

| 账号 | 密码 |
|------|------|
| admin | admin123 |

> ⚠️ 首次登录后请立即在「系统设置」中修改密码

---

## 九、PM2 常用命令

```bash
pm2 list              # 查看进程
pm2 logs coffee-api   # 查看日志
pm2 restart coffee-api # 重启
pm2 stop coffee-api   # 停止
```
