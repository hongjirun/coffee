const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    cb(null, `product_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) cb(null, true);
    else cb(new Error('只支持jpg/png/webp格式'));
  }
});

// 获取商品列表（支持分类筛选、分页）
router.get('/', async (req, res) => {
  try {
    const { category_id, page = 1, limit = 20, keyword } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    if (category_id) { sql += ' AND p.category_id = ?'; params.push(category_id); }
    if (keyword) { sql += ' AND p.name LIKE ?'; params.push(`%${keyword}%`); }
    sql += ' ORDER BY p.sort_order ASC, p.id DESC';
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${(parseInt(page) - 1) * parseInt(limit)}`;

    const [rows] = await db.execute(sql, params);
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM products p WHERE 1=1${category_id ? ' AND p.category_id = ?' : ''}${keyword ? ' AND p.name LIKE ?' : ''}`,
      params.slice(0, params.length)
    );

    rows.forEach(row => {
      ['sugar_options', 'ice_options', 'size_options', 'addon_options'].forEach(field => {
        if (typeof row[field] === 'string') {
          try { row[field] = JSON.parse(row[field]); } catch { row[field] = []; }
        }
      });
    });

    res.json({
      code: 200,
      data: { list: rows, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
});

// 获取启用商品列表（小程序用，按分类）
router.get('/active', async (req, res) => {
  try {
    const { category_id } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1
    `;
    const params = [];
    if (category_id) { sql += ' AND p.category_id = ?'; params.push(category_id); }
    sql += ' ORDER BY p.sort_order ASC, p.id ASC';

    const [rows] = await db.execute(sql, params);
    rows.forEach(row => {
      ['sugar_options', 'ice_options', 'size_options', 'addon_options'].forEach(field => {
        if (typeof row[field] === 'string') {
          try { row[field] = JSON.parse(row[field]); } catch { row[field] = []; }
        }
      });
    });
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取单个商品详情
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ code: 404, message: '商品不存在' });
    const product = rows[0];
    ['sugar_options', 'ice_options', 'size_options', 'addon_options'].forEach(field => {
      if (typeof product[field] === 'string') {
        try { product[field] = JSON.parse(product[field]); } catch { product[field] = []; }
      }
    });
    res.json({ code: 200, data: product });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 上传商品图片
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '请选择图片' });
  const host = `${req.protocol}://${req.get('host')}`;
  const url = `${host}/uploads/${req.file.filename}`;
  res.json({ code: 200, data: { url }, message: '上传成功' });
});

// 新增商品
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      category_id, name, description, image, base_price,
      is_active = 1, sort_order = 0,
      sugar_options = [], ice_options = [], size_options = [], addon_options = []
    } = req.body;
    if (!category_id || !name || base_price === undefined) {
      return res.status(400).json({ code: 400, message: '分类、名称和价格不能为空' });
    }
    const [result] = await db.execute(
      `INSERT INTO products (category_id, name, description, image, base_price, is_active, sort_order, sugar_options, ice_options, size_options, addon_options)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id, name, description, image, base_price, is_active, sort_order,
        JSON.stringify(sugar_options), JSON.stringify(ice_options),
        JSON.stringify(size_options), JSON.stringify(addon_options)
      ]
    );
    res.json({ code: 200, message: '创建成功', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
});

// 更新商品
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      category_id, name, description, image, base_price,
      is_active, sort_order,
      sugar_options, ice_options, size_options, addon_options
    } = req.body;
    await db.execute(
      `UPDATE products SET category_id=?, name=?, description=?, image=?, base_price=?,
       is_active=?, sort_order=?, sugar_options=?, ice_options=?, size_options=?, addon_options=?
       WHERE id=?`,
      [
        category_id, name, description, image, base_price,
        is_active, sort_order,
        JSON.stringify(sugar_options), JSON.stringify(ice_options),
        JSON.stringify(size_options), JSON.stringify(addon_options),
        req.params.id
      ]
    );
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
});

// 切换上下架
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    await db.execute(
      'UPDATE products SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?',
      [req.params.id]
    );
    res.json({ code: 200, message: '操作成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除商品
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
