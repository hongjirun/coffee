const bcrypt = require('bcryptjs')
const db = require('./index')

const NEW_PASSWORD = 'LXQ666888'

async function resetPassword() {
  try {
    const hash = await bcrypt.hash(NEW_PASSWORD, 10)
    const [result] = await db.execute(
      'UPDATE admins SET password = ? WHERE username = ?',
      [hash, 'LXQ666']
    )
    if (result.affectedRows === 0) {
      console.log('❌ 未找到 LXQ666 账号，尝试查询所有管理员...')
      const [rows] = await db.execute('SELECT id, username FROM admins')
      console.log('当前数据库中的管理员账号:', rows)
    } else {
      console.log(`✅ 密码重置成功！`)
      console.log(`   账号: LXQ666`)
      console.log(`   新密码: ${NEW_PASSWORD}`)
    }
    process.exit(0)
  } catch (err) {
    console.error('❌ 重置失败:', err.message)
    process.exit(1)
  }
}

resetPassword()
