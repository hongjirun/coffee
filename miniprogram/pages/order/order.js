const { request } = require('../../utils/request')

const STATUS_MAP = {
  pending: '待制作',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消'
}

Page({
  data: {
    mode: 'list',
    order: null,
    orders: [],
    loading: true
  },

  onLoad(options) {
    if (options.order_no) {
      this.setData({ mode: 'detail' })
      wx.setNavigationBarTitle({ title: '订单详情' })
      this.loadOrderDetail(options.order_no)
    } else {
      this.setData({ mode: 'list' })
      wx.setNavigationBarTitle({ title: '我的订单' })
      this.loadOrders()
    }
  },

  async loadOrderDetail(orderNo) {
    try {
      const res = await request(`/orders/no/${orderNo}`)
      const order = res.data
      order.status_text = STATUS_MAP[order.status] || order.status
      if (order.items) {
        order.items.forEach(item => {
          if (typeof item.addons === 'string') {
            try { item.addons = JSON.parse(item.addons) } catch { item.addons = [] }
          }
          item.addons_text = item.addons && item.addons.length > 0
            ? item.addons.map(a => a.name || a).join('、')
            : '无'
        })
      }
      this.setData({ order, loading: false })
    } catch {
      wx.showToast({ title: '订单不存在', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  loadOrders() {
    const history = wx.getStorageSync('order_history') || []
    this.setData({ orders: history.reverse(), loading: false })
  },

  goHome() {
    wx.navigateTo({ url: '/pages/index/index' })
  }
})
