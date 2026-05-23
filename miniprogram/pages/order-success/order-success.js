Page({
  data: {
    orderNo: '',
    total: ''
  },

  onLoad(options) {
    this.setData({
      orderNo: options.order_no || '',
      total: options.total || ''
    })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  goOrders() {
    wx.switchTab({ url: '/pages/order/order' })
  }
})
