const { request } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    cart: [],
    customerName: '',
    customerPhone: '',
    remark: '',
    totalPrice: '0.00',
    submitting: false,
    orderDone: false,
    orderSummary: null,
    chosenAddress: null
  },

  onChooseAddress() {
    wx.chooseAddress({
      success: (res) => {
        this.setData({ chosenAddress: res })
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要授权',
            content: '请允许获取地址权限',
            confirmText: '去授权',
            success: (r) => { if (r.confirm) wx.openSetting() }
          })
        }
      }
    })
  },

  onShareAppMessage() {
    const s = this.data.orderSummary
    if (s) return {
      title: s.title,
      path: `/pages/order/order?order_no=${s.orderNo}`
    }
    return { title: '咖啡角点单啦！', path: '/pages/index/index' }
  },

  goHome() {
    wx.switchTab ? wx.switchTab({ url: '/pages/index/index' }) : wx.navigateBack()
  },

  goOrder() {
    wx.navigateBack()
  },

  onCopyOrder() {
    wx.setClipboardData({
      data: this.data.orderSummary.summaryText,
      success: () => wx.showToast({ title: '已复制，去群里粘贴吧', icon: 'success' })
    })
  },

  onShareToGroup() {
    wx.showModal({
      title: '隐私保护提示',
      content: '您的收件地址和联系方式已加密，群里成员无法看到，仅商家后台可见。是否确认转发？',
      confirmText: '确认转发',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 触发分享
          wx.showShareMenu({ withShareTicket: true })
          wx.showToast({ title: '请点右上角转发', icon: 'none', duration: 2000 })
        }
      }
    })
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
    const { cart, customerName, remark, chosenAddress } = this.data
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

      const baseAddr = chosenAddress
        ? `${chosenAddress.provinceName}${chosenAddress.cityName}${chosenAddress.countyName}${chosenAddress.detailInfo}`
        : ''
      const fullName = chosenAddress
        ? `${chosenAddress.userName}（${chosenAddress.telNumber}）`
        : customerName

      const res = await request('/orders', 'POST', {
        customer_name: fullName || customerName,
        customer_phone: chosenAddress ? chosenAddress.telNumber : '',
        remark: baseAddr ? `地址：${baseAddr}${remark ? ' ' + remark : ''}` : remark,
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

      // 生成订单摘要（支持多商品）
      const orderNo = res.data.order_no
      const lines = []
      cart.forEach(item => {
        const sizeName = item.size ? (item.size.name || item.size) : ''
        const addonStr = (item.addons && item.addons.length) ? item.addons.map(a => a.name).join('、') : ''
        lines.push(`🥤 ${item.product_name} x${item.quantity}`)
        if (sizeName || item.sugar || item.ice) {
          lines.push(`   ${[sizeName, item.ice, item.sugar, addonStr].filter(Boolean).join(' / ')}`)
        }
      })
      lines.push(`💰 合计：¥${res.data.total_amount}`)
      // 收件人和地址对群里显示星号，保护隐私
      if (chosenAddress) {
        lines.push(`👤 收件人：******`)
        lines.push(`📍 地址：******`)
      } else if (customerName) {
        lines.push(`👤 姓名：******`)
      }
      if (remark) lines.push(`📝 备注：${remark}`)
      lines.push(`🔖 订单号：${orderNo}`)

      this.setData({
        cart: [],
        orderDone: true,
        orderSummary: {
          lines,
          summaryText: lines.join('\n'),
          title: `【咖啡角订单】共 ${cart.reduce((s,i)=>s+i.quantity,0)} 杯 · ¥${res.data.total_amount}`,
          orderNo
        }
      })
    } catch {
      this.setData({ submitting: false })
    }
  }
})
