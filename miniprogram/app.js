// 线上 API 地址
const BASE_URL = 'https://api.xianshihuodong.xyz/api'

App({
  globalData: {
    baseUrl: BASE_URL,
    cart: []
  },

  onLaunch() {
    const cart = wx.getStorageSync('cart')
    if (cart) this.globalData.cart = cart
  },

  saveCart() {
    wx.setStorageSync('cart', this.globalData.cart)
  },

  getCartCount() {
    return this.globalData.cart.reduce((sum, item) => sum + item.quantity, 0)
  },

  addToCart(item) {
    const cart = this.globalData.cart
    const key = `${item.product_id}_${item.size?.name || ''}_${item.sugar || ''}_${item.ice || ''}_${JSON.stringify(item.addons || [])}`
    const existing = cart.find(c => c._key === key)
    if (existing) {
      existing.quantity += item.quantity || 1
    } else {
      cart.push({ ...item, _key: key, quantity: item.quantity || 1 })
    }
    this.saveCart()
  },

  clearCart() {
    this.globalData.cart = []
    this.saveCart()
  }
})
