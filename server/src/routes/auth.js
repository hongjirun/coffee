const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'coffee_secret',
      { expiresIn: '7d' }
    );
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        admin: { id: admin.id, username: admin.username, avatar: admin.avatar }
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
});

// 获取当前管理员信息
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, username, avatar, created_at FROM admins WHERE id = ?', [req.admin.id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 修改密码
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const [rows] = await db.execute('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
    const admin = rows[0];
    const valid = await bcrypt.compare(oldPassword, admin.password);
    if (!valid) {
      return res.status(400).json({ code: 400, message: '原密码错误' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE admins SET password = ? WHERE id = ?', [hashed, req.admin.id]);
    res.json({ code: 200, message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 修改用户名
router.put('/username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 2 || username.length > 20) {
      return res.status(400).json({ code: 400, message: '用户名长度需在2-20个字符之间' });
    }
    // 检查用户名是否已被使用
    const [existing] = await db.execute('SELECT id FROM admins WHERE username = ? AND id != ?', [username, req.admin.id]);
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该用户名已被使用' });
    }
    await db.execute('UPDATE admins SET username = ? WHERE id = ?', [username, req.admin.id]);
    res.json({ code: 200, message: '用户名修改成功', data: { username } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
