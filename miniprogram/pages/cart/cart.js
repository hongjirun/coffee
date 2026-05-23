const { request } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    cart: [],
    customerName: '',
    customerPhone: '',
    remark: '',
    totalPrice: '0.00',
    submitting: false
  },

  onNameInput(e) { this.setData({ customerName: e.detail.value }) },
  onPhoneInput(e) { this.setData({ customerPhone: e.detail.value }) },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }) },

  onShow() {
    this.loadCart()
  },

  loadCart() {
    const cart = app.globalData.cart
    this.setData({ cart })
    this.calcTotal(cart)
  },

  calcTotal(cart) {
    const total = cart.reduce((sum, item) => {
      return sum + parseFloat(item.unit_price) * item.quantity
    }, 0)
    this.setData({ totalPrice: total.toFixed(2) })
  },

  onQuantityChange(e) {
    const { index, type } = e.currentTarget.dataset
    const cart = [...this.data.cart]
    if (type === 'minus') {
      if (cart[index].quantity > 1) {
        cart[index].quantity--
      } else {
        cart.splice(index, 1)
      }
    } else {
      cart[index].quantity++
    }
    app.globalData.cart = cart
    app.saveCart()
    this.setData({ cart })
    this.calcTotal(cart)
  },

  onRemoveItem(e) {
    const { index } = e.currentTarget.dataset
    wx.showModal({
      title: '提示',
      content: '确定要移除这杯饮品吗？',
      success: (res) => {
        if (res.confirm) {
          const cart = [...this.data.cart]
          cart.splice(index, 1)
          app.globalData.cart = cart
          app.saveCart()
          this.setData({ cart })
          this.calcTotal(cart)
        }
      }
    })
  },

  clearCart() {
    wx.showModal({
      title: '提示',
      content: '确定清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearCart()
          this.setData({ cart: [], totalPrice: '0.00' })
        }
      }
    })
  },

  async submitOrder() {
    const { cart, customerName, customerPhone, remark } = this.data
    if (cart.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })

    try {
      const items = cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        unit_price: item.unit_price,
        size: item.size,
        sugar: item.sugar,
        ice: item.ice,
        addons: item.addons,
        quantity: item.quantity
      }))

      const res = await request('/orders', 'POST', {
        customer_name: customerName,
        customer_phone: customerPhone,
        remark,
        items
      })

      // 保存本地订单历史
      const history = wx.getStorageSync('order_history') || []
      history.push({
        order_no: res.data.order_no,
        total_amount: res.data.total_amount,
        status: 'pending',
        status_text: '待制作',
        created_at: new Date().toLocaleString('zh-CN')
      })
      wx.setStorageSync('order_history', history)

      app.clearCart()
      wx.redirectTo({
        url: `/pages/order-success/order-success?order_no=${res.data.order_no}&total=${res.data.total_amount}`
      })
    } catch {
      this.setData({ submitting: false })
    }
  }
})
