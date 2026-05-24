const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/qrcodes');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    // 使用临时文件名，在路由中重命名
    const filename = `temp_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'), false);
    }
  }
});

// 获取所有设置（公开接口，供小程序使用）
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT `key`, `value` FROM settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json({ code: 200, data: settings });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取指定设置
router.get('/:key', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT `value` FROM settings WHERE `key` = ?', [req.params.key]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '设置项不存在' });
    }
    res.json({ code: 200, data: { key: req.params.key, value: rows[0].value } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新设置（需要管理员权限）
router.put('/:key', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body;
    await db.execute('UPDATE settings SET `value` = ? WHERE `key` = ?', [value, req.params.key]);
    res.json({ code: 200, message: '设置更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 批量更新设置
router.put('/', authMiddleware, async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE (UPSERT)
      await db.execute(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, value]
      );
    }
    res.json({ code: 200, message: '设置更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
});

// 上传二维码图片
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请上传图片' });
    }
    
    const { type } = req.body; // 'wechat_group' 或 'wechat_pay'
    if (!type || !['wechat_group', 'wechat_pay'].includes(type)) {
      // 删除临时文件
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ code: 400, message: '请指定正确的类型: wechat_group 或 wechat_pay' });
    }
    
    // 重命名文件
    const ext = path.extname(req.file.originalname) || '.jpg';
    const newFilename = `${type}_qrcode_${Date.now()}${ext}`;
    const newPath = path.join(req.file.destination, newFilename);
    
    fs.renameSync(req.file.path, newPath);
    
    // 生成URL
    const fileUrl = `/uploads/qrcodes/${newFilename}`;
    
    // 更新数据库
    const key = type === 'wechat_group' ? 'wechat_group_qrcode' : 'wechat_pay_qrcode';
    await db.execute('UPDATE settings SET `value` = ? WHERE `key` = ?', [fileUrl, key]);
    
    res.json({ 
      code: 200, 
      message: '上传成功',
      data: { url: fileUrl, key: key }
    });
  } catch (err) {
    // 清理临时文件
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
});

module.exports = router;
