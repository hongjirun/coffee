const { request } = require('../../utils/request')

Page({
  data: {
    categories: [],
    products: [],
    activeCategory: 0,
    loading: true,
    // 功能开关
    settings: {
      normal_mode: true,
      review_mode: false
    },
    allProducts: [], // 审核模式展示全部商品
    cartCount: 0,

    // 弹窗相关
    showPanel: false,
    currentProduct: null,
    currentSizeImage: '',
    selectedSize: null,
    selectedSugar: null,
    selectedIce: null,
    selectedAddons: [],
    quantity: 1,
    totalPrice: '0.00',
    remark: '',

    // 下单信息
    showOrderForm: false,
    customerName: '',
    chosenAddress: null,
    addressDetail: '',
    orderReady: false,
    orderSummary: null
  },

  onLoad() {
    this.loadCategories()
    this.loadSettings()
  },

  onShow() {
    this.loadSettings()
    this.updateCartCount()
  },

  updateCartCount() {
    const app = getApp()
    this.setData({ cartCount: app.getCartCount() })
  },

  async loadSettings() {
    try {
      const res = await request('/settings')
      const normalMode = res.data.normal_mode !== 'false'
      const reviewMode = res.data.review_mode === 'true'
      this.setData({
        'settings.normal_mode': normalMode,
        'settings.review_mode': reviewMode
      })
      if (reviewMode) {
        this.loadAllProducts()
      }
    } catch(err) {
      this.setData({
        'settings.normal_mode': true,
        'settings.review_mode': false
      })
    }
  },

  async loadAllProducts() {
    try {
      const res = await request('/products/active')
      this.setData({ allProducts: res.data })
    } catch {}
  },

  onShareAppMessage() {
    const summary = this.data.orderSummary
    if (summary && summary.orderNo) {
      return {
        title: summary.title,
        path: `/pages/order/order?order_no=${summary.orderNo}`,
        imageUrl: summary.imageUrl || ''
      }
    }
    return { title: '咖啡角 - 点单啦！', path: '/pages/index/index' }
  },

  async loadCategories() {
    try {
      const res = await request('/categories/active')
      const categories = res.data
      this.setData({ categories, loading: false })
      if (categories.length > 0) {
        this.setData({ activeCategory: categories[0].id })
        this.loadProducts(categories[0].id)
      }
    } catch {
      this.setData({ loading: false })
    }
  },

  async loadProducts(categoryId) {
    try {
      const res = await request(`/products/active?category_id=${categoryId}`)
      this.setData({ products: res.data })
    } catch {}
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeCategory: id })
    this.loadProducts(id)
  },

  // 点击科普文章卡片
  onArticleTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/article/article?id=${id}` })
  },

  // 点击商品卡片（审核模式跳详情，正常模式不处理）
  onProductTap(e) {
    if (this.data.settings.review_mode) {
      const id = e.currentTarget.dataset.id
      wx.navigateTo({ url: `/pages/product/product?id=${id}&review=1` })
    }
  },

  // 加入购物车
  onAddToCart() {
    const { currentProduct, selectedSize, selectedSugar, selectedIce, selectedAddons, quantity, totalPrice } = this.data
    if (currentProduct.sizeOptions.length > 0 && !selectedSize) {
      wx.showToast({ title: '请选择杯型', icon: 'none' }); return
    }
    if (currentProduct.sugarOptions.length > 0 && !selectedSugar) {
      wx.showToast({ title: '请选择糖度', icon: 'none' }); return
    }
    if (currentProduct.iceOptions.length > 0 && !selectedIce) {
      wx.showToast({ title: '请选择温度/冰度', icon: 'none' }); return
    }
    const app = getApp()
    app.addToCart({
      product_id: currentProduct.id,
      product_name: currentProduct.name,
      product_image: currentProduct.image || null,
      size: selectedSize || null,
      sugar: selectedSugar ? selectedSugar.name : null,
      ice: selectedIce ? selectedIce.name : null,
      addons: selectedAddons,
      remark: this.data.remark || '',
      quantity,
      unit_price: (parseFloat(totalPrice) / quantity).toFixed(2)
    })
    this.updateCartCount()
    this.setData({ showPanel: false, remark: '' })
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },

  goCart() {
    wx.navigateTo({ url: '/pages/cart/cart' })
  },

  // 点击 + 号打开选项面板
  onOpenPanel(e) {
    const product = e.currentTarget.dataset.product
    const sizeOptions = this._parseOptions(product.size_options)
    const sugarOptions = this._parseOptions(product.sugar_options)
    const iceOptions = this._parseOptions(product.ice_options)
    const addonOptions = this._parseOptions(product.addon_options)

    const defaultSize = sizeOptions.length > 0 ? sizeOptions[0] : null
    const defaultSugar = sugarOptions.length > 0 ? sugarOptions[0] : null
    const defaultIce = iceOptions.length > 0 ? iceOptions[0] : null

    this.setData({
      showPanel: true,
      currentProduct: {
        ...product,
        sizeOptions,
        sugarOptions,
        iceOptions,
        addonOptions
      },
      selectedSize: defaultSize,
      selectedSugar: defaultSugar,
      selectedIce: defaultIce,
      selectedAddons: [],
      quantity: 1,
      remark: '',
      currentSizeImage: defaultSize?.name === '大杯' ? (product.large_image || '') : (product.medium_image || ''),
      showOrderForm: false,
      orderReady: false,
      customerName: '',
      chosenAddress: null,
      addressDetail: ''
    })
    this._calcPrice()
  },

  _parseOptions(val) {
    if (!val) return []
    try {
      const arr = typeof val === 'string' ? JSON.parse(val) : val
      return arr.map(item => {
        if (typeof item === 'string') return { name: item, price: 0 }
        return item
      })
    } catch { return [] }
  },

  _calcPrice() {
    const { currentProduct, selectedSize, selectedAddons, quantity } = this.data
    if (!currentProduct) return
    let price = parseFloat(currentProduct.base_price) || 0
    if (selectedSize && selectedSize.price) price += parseFloat(selectedSize.price)
    if (selectedAddons && selectedAddons.length) {
      selectedAddons.forEach(a => { price += parseFloat(a.price) || 0 })
    }
    this.setData({ totalPrice: (price * quantity).toFixed(2) })
  },

  onSelectSize(e) {
    const size = e.currentTarget.dataset.item
    const product = this.data.currentProduct
    const currentSizeImage = size?.name === '大杯' ? (product.large_image || '') : (product.medium_image || '')
    this.setData({ selectedSize: size, currentSizeImage })
    this._calcPrice()
  },

  onSelectSugar(e) {
    this.setData({ selectedSugar: e.currentTarget.dataset.item })
  },

  onSelectIce(e) {
    this.setData({ selectedIce: e.currentTarget.dataset.item })
  },

  onToggleAddon(e) {
    const addon = e.currentTarget.dataset.item
    let addons = [...this.data.selectedAddons]
    const idx = addons.findIndex(a => a.name === addon.name)
    if (idx >= 0) addons.splice(idx, 1)
    else addons.push(addon)
    this.setData({ selectedAddons: addons })
    this._calcPrice()
  },

  onQuantityMinus() {
    if (this.data.quantity <= 1) return
    this.setData({ quantity: this.data.quantity - 1 })
    this._calcPrice()
  },

  onQuantityPlus() {
    this.setData({ quantity: this.data.quantity + 1 })
    this._calcPrice()
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onClosePanel() {
    this.setData({ showPanel: false, showOrderForm: false, orderReady: false, remark: '' })
  },

  // 点「确认选择」→ 展示地址填写
  onConfirmOptions() {
    const { selectedSize, selectedSugar, selectedIce, currentProduct } = this.data
    if (currentProduct.sizeOptions.length > 0 && !selectedSize) {
      wx.showToast({ title: '请选择杯型', icon: 'none' }); return
    }
    if (currentProduct.sugarOptions.length > 0 && !selectedSugar) {
      wx.showToast({ title: '请选择糖度', icon: 'none' }); return
    }
    if (currentProduct.iceOptions.length > 0 && !selectedIce) {
      wx.showToast({ title: '请选择温度/冰度', icon: 'none' }); return
    }
    this.setData({ showOrderForm: true })
  },

  onNameInput(e) { this.setData({ customerName: e.detail.value }) },
  onDetailInput(e) { this.setData({ addressDetail: e.detail.value }) },

  onChooseAddress() {
    wx.chooseAddress({
      success: (res) => {
        this.setData({ chosenAddress: res, addressDetail: '' })
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要授权',
            content: '请允许获取地址权限，方便我们准确送达',
            confirmText: '去授权',
            success: (r) => { if (r.confirm) wx.openSetting() }
          })
        }
      }
    })
  },

  // 提交订单到后端，成功后准备转发
  async onGenerateOrder() {
    const { currentProduct, selectedSize, selectedSugar, selectedIce, selectedAddons, quantity, totalPrice, customerName, chosenAddress, addressDetail } = this.data
    if (!customerName.trim()) {
      wx.showToast({ title: '请填写您的姓名', icon: 'none' }); return
    }
    if (!chosenAddress) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' }); return
    }

    const baseAddr = `${chosenAddress.provinceName}${chosenAddress.cityName}${chosenAddress.countyName}${chosenAddress.detailInfo}`
    const fullAddr = addressDetail.trim() ? `${baseAddr} ${addressDetail.trim()}` : baseAddr
    const fullName = `${chosenAddress.userName}（${chosenAddress.telNumber}）`
    const addonStr = selectedAddons.length > 0 ? selectedAddons.map(a => a.name).join('、') : '无'

    wx.showLoading({ title: '提交中...' })
    try {
      const res = await request('/orders', 'POST', {
        customer_name: fullName,
        customer_phone: chosenAddress.telNumber,
        remark: `地址：${fullAddr}${addressDetail.trim() ? '（' + addressDetail.trim() + '）' : ''}`,
        items: [{
          product_id: currentProduct.id,
          product_name: currentProduct.name,
          product_image: currentProduct.image || null,
          size: selectedSize || null,
          sugar: selectedSugar ? selectedSugar.name : null,
          ice: selectedIce ? selectedIce.name : null,
          addons: selectedAddons,
          quantity,
          unit_price: currentProduct.base_price
        }]
      })
      wx.hideLoading()

      const orderNo = res.data.order_no
      const shareTitle = `【咖啡角订单】${currentProduct.name} x${quantity} | ${selectedSize ? selectedSize.name : ''} ${selectedIce ? selectedIce.name : ''} | ¥${totalPrice}`

      const lines = [
        `📦 商品：${currentProduct.name}`,
        `🥤 杯型：${selectedSize ? selectedSize.name : '-'}`,
        `🌡️ 温度：${selectedIce ? selectedIce.name : '-'}`,
        `🍬 糖度：${selectedSugar ? selectedSugar.name : '-'}`,
        `➕ 加料：${addonStr}`,
        `🔢 数量：${quantity} 杯`,
        `💰 金额：¥${totalPrice}`,
        `👤 收件人：******`,
        `📍 地址：******`,
        `🔖 订单号：${orderNo}`
      ]

      this.setData({
        orderReady: true,
        orderSummary: {
          lines,
          summaryText: lines.join('\n'),
          title: shareTitle,
          orderNo,
          imageUrl: currentProduct.image || ''
        }
      })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
    }
  },

  // 复制订单文本到剪贴板（方便粘贴到群）
  onCopyOrder() {
    wx.setClipboardData({
      data: this.data.orderSummary.summaryText,
      success: () => wx.showToast({ title: '已复制，去群里粘贴吧', icon: 'success' })
    })
  },

  // 转发卡片到群
  onShareToGroup() {
    // 触发 onShareAppMessage，需要用户点击转发按钮
    wx.showToast({ title: '请点击右上角菜单转发', icon: 'none', duration: 2000 })
  },

  goGuide() {
    wx.navigateTo({ url: '/pages/guide/guide' })
  }
})
