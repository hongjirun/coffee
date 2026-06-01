const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 生成订单号
function generateOrderNo() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `LXQ${dateStr}${random}`;
}

// 提交订单（小程序调用）
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { customer_name, customer_phone, remark, customer_note, items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ code: 400, message: '订单不能为空' });
    }

    let totalAmount = 0;
    for (const item of items) {
      const unitPrice = parseFloat(item.unit_price);
      item._finalPrice = unitPrice;
      totalAmount += unitPrice * item.quantity;
    }

    const orderNo = generateOrderNo();
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (order_no, customer_name, customer_phone, remark, customer_note, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [orderNo, customer_name, customer_phone, remark, customer_note || '', totalAmount.toFixed(2)]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, size, sugar, ice, addons, quantity, unit_price, subtotal, item_note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, item.product_id, item.product_name, item.product_image,
          item.size ? (typeof item.size === 'object' ? item.size.name : item.size) : null,
          item.sugar || null, item.ice || null,
          JSON.stringify(item.addons || []),
          item.quantity, item._finalPrice.toFixed(2),
          (item._finalPrice * item.quantity).toFixed(2),
          item.item_note || ''
        ]
      );
    }

    await conn.commit();
    res.json({ code: 200, message: '下单成功', data: { order_no: orderNo, total_amount: totalAmount.toFixed(2) } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  } finally {
    conn.release();
  }
});

// 按订单号查询订单（公开接口，供小程序分享卡片使用）
router.get('/no/:order_no', async (req, res) => {
  try {
    const [orders] = await db.execute('SELECT * FROM orders WHERE order_no = ?', [req.params.order_no]);
    if (orders.length === 0) return res.status(404).json({ code: 404, message: '订单不存在' });
    const order = orders[0];
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    items.forEach(item => {
      if (typeof item.addons === 'string') {
        try { item.addons = JSON.parse(item.addons); } catch { item.addons = []; }
      }
    });
    order.items = items;
    // 公开接口脱敏：手机号和地址不对外暴露
    order.customer_name = order.customer_name ? order.customer_name.replace(/[\s\S]*/, '******') : '******';
    order.customer_phone = order.customer_phone ? '******' : '';
    order.remark = order.remark ? order.remark.replace(/[\s\S]*/, '******') : '******';
    res.json({ code: 200, data: order });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取订单列表（后台）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (keyword) { sql += ' AND (order_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    sql += ' ORDER BY created_at DESC';
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${(parseInt(page) - 1) * parseInt(limit)}`;

    const [rows] = await db.execute(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];
    if (status) { countSql += ' AND status = ?'; countParams.push(status); }
    if (keyword) { countSql += ' AND (order_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)'; countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    const [countResult] = await db.execute(countSql, countParams);

    res.json({ code: 200, data: { list: rows, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取订单详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [orders] = await db.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) return res.status(404).json({ code: 404, message: '订单不存在' });
    const order = orders[0];
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    items.forEach(item => {
      if (typeof item.addons === 'string') {
        try { item.addons = JSON.parse(item.addons); } catch { item.addons = []; }
      }
    });
    order.items = items;
    res.json({ code: 200, data: order });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新订单状态
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatus = ['pending', 'preparing', 'completed', 'cancelled'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ code: 400, message: '状态值无效' });
    }
    await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ code: 200, message: '状态更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取统计数据
router.get('/stats/dashboard', authMiddleware, async (req, res) => {
  try {
    const [[todayOrders]] = await db.execute(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as amount FROM orders WHERE DATE(created_at) = CURDATE()"
    );
    const [[totalOrders]] = await db.execute(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as amount FROM orders WHERE status != 'cancelled'"
    );
    const [[pendingOrders]] = await db.execute(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
    );
    const [[productCount]] = await db.execute(
      "SELECT COUNT(*) as count FROM products WHERE is_active = 1"
    );
    res.json({
      code: 200,
      data: {
        today_orders: todayOrders.count,
        today_amount: todayOrders.amount,
        total_orders: totalOrders.count,
        total_amount: totalOrders.amount,
        pending_orders: pendingOrders.count,
        active_products: productCount.count
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
});

// 删除订单
router.delete('/:id', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    // 先删除订单商品
    await conn.execute('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
    
    // 再删除订单
    const [result] = await conn.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    
    await conn.commit();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ code: 500, message: '服务器错误' });
  } finally {
    conn.release();
  }
});

module.exports = router;
