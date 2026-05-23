# ☕ 凌小巧咖啡店 - 点单系统

## 项目概述

完整的咖啡点单系统，包含：
- **微信小程序**：顾客点单前台，支持糖度/冰度/规格/加料选择
- **Vue3 后台**：商品管理、分类管理、订单管理
- **Node.js API**：RESTful 接口服务
- **MySQL**：数据存储

## 快速开始

### 1. 启动后端 API

```bash
cd server
cp .env.example .env    # 配置数据库
npm install
npm run dev             # 开发模式
```

### 2. 初始化数据库

```bash
mysql -u root -p < server/src/db/init.sql
```

### 3. 启动后台管理

```bash
cd admin
npm install
npm run dev
# 访问 http://localhost:5173
```

### 4. 打开微信小程序

- 使用微信开发者工具打开 `miniprogram/` 目录
- 修改 `app.js` 中的 `BASE_URL` 为本地 API 地址：`http://localhost:3000/api`

## 默认账号

- 用户名：`admin`
- 密码：`admin123`

## 目录说明

```
├── server/           # Node.js + Express 后端
│   ├── src/
│   │   ├── app.js           # 入口文件
│   │   ├── routes/          # API路由
│   │   ├── middleware/      # 中间件
│   │   └── db/              # 数据库配置 & SQL
│   └── uploads/             # 上传图片存储
│
├── admin/            # Vue3 后台管理系统
│   └── src/
│       ├── views/           # 页面组件
│       ├── layout/          # 布局组件
│       ├── stores/          # Pinia 状态
│       ├── api/             # API 请求
│       └── router/          # 路由配置
│
└── miniprogram/      # 微信原生小程序
    └── pages/
        ├── index/           # 点单首页（分类+商品列表）
        ├── product/         # 商品详情（规格选择）
        ├── cart/            # 购物车 & 提交订单
        ├── order/           # 我的订单
        └── order-success/   # 下单成功页
```

## 部署

详见 [DEPLOY.md](./DEPLOY.md)
