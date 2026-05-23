const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 获取所有分类（公开接口）
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取启用分类（小程序用）
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 新增分类（需要鉴权）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, sort_order = 0 } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
    const [result] = await db.execute(
      'INSERT INTO categories (name, sort_order) VALUES (?, ?)',
      [name, sort_order]
    );
    res.json({ code: 200, message: '创建成功', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新分类
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, sort_order, is_active } = req.body;
    await db.execute(
      'UPDATE categories SET name = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [name, sort_order, is_active, req.params.id]
    );
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除分类
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [products] = await db.execute(
      'SELECT COUNT(*) as cnt FROM products WHERE category_id = ?',
      [req.params.id]
    );
    if (products[0].cnt > 0) {
      return res.status(400).json({ code: 400, message: '该分类下还有商品，无法删除' });
    }
    await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
