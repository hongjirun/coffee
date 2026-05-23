const bcrypt = require('bcryptjs')
const db = require('./index')

async function seed() {
  try {
    // 管理员
    const hash = await bcrypt.hash('admin123', 10)
    await db.execute(
      'INSERT INTO admins (username, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE username=username',
      ['admin', hash]
    )
    console.log('✅ 管理员账号初始化完成')

    // 分类
    const categories = ['招牌系列', '拿铁系列', '手冲系列', '茶饮系列', '特调系列']
    for (let i = 0; i < categories.length; i++) {
      await db.execute(
        'INSERT INTO categories (name, sort_order) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
        [categories[i], i + 1]
      )
    }
    console.log('✅ 分类数据初始化完成')

    // 示例商品
    const products = [
      {
        category_id: 1, name: '凌小巧特调拿铁',
        description: '精选埃塞俄比亚单品咖啡豆，搭配新鲜牛奶，口感醇厚细腻',
        base_price: 28.00,
        sugar_options: ['无糖', '少糖', '半糖', '七分糖', '全糖'],
        ice_options: ['去冰', '少冰', '正常冰', '多冰'],
        size_options: [{ name: '中杯', price: 0 }, { name: '大杯', price: 5 }],
        addon_options: [{ name: '珍珠', price: 3 }, { name: '椰果', price: 2 }, { name: '布丁', price: 3 }]
      },
      {
        category_id: 2, name: '燕麦拿铁',
        description: '精选燕麦奶替代传统牛奶，健康轻盈，带有自然麦香',
        base_price: 32.00,
        sugar_options: ['无糖', '少糖', '半糖', '全糖'],
        ice_options: ['去冰', '少冰', '正常冰', '多冰'],
        size_options: [{ name: '中杯', price: 0 }, { name: '大杯', price: 5 }],
        addon_options: [{ name: '珍珠', price: 3 }, { name: '椰果', price: 2 }]
      },
      {
        category_id: 3, name: '手冲耶加雪菲',
        description: '来自埃塞俄比亚耶加雪菲产区，花香果酸，清新明亮',
        base_price: 38.00,
        sugar_options: ['不加糖'],
        ice_options: ['热', '冰'],
        size_options: [{ name: '单杯', price: 0 }],
        addon_options: []
      }
    ]

    for (const p of products) {
      await db.execute(
        `INSERT INTO products (category_id, name, description, base_price, sugar_options, ice_options, size_options, addon_options)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.category_id, p.name, p.description, p.base_price,
          JSON.stringify(p.sugar_options), JSON.stringify(p.ice_options),
          JSON.stringify(p.size_options), JSON.stringify(p.addon_options)
        ]
      )
    }
    console.log('✅ 示例商品初始化完成')
    console.log('\n🎉 数据库初始化全部完成！')
    console.log('   账号: admin   密码: admin123')
    process.exit(0)
  } catch (err) {
    console.error('❌ 初始化失败:', err.message)
    process.exit(1)
  }
}

seed()
