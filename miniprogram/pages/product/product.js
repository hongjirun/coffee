const { request } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    product: null,
    loading: true,
    reviewMode: false,
    // 用户选择
    selectedSize: null,
    selectedSugar: '',
    selectedIce: '',
    selectedAddons: [],
    quantity: 1,
    totalPrice: 0,
    currentSizeImage: '',
    itemNote: ''
  },

  onLoad(options) {
    const { id, review } = options
    this.setData({ reviewMode: review === '1' })
    this.loadProduct(id)
  },

  async loadProduct(id) {
    try {
      const res = await request(`/products/${id}`)
      const product = res.data

      // 默认选中第一项
      const selectedSize = product.size_options && product.size_options.length > 0
        ? product.size_options[0] : null
      const selectedSugar = product.sugar_options && product.sugar_options.length > 0
        ? product.sugar_options[Math.floor(product.sugar_options.length / 2)] : ''
      const selectedIce = product.ice_options && product.ice_options.length > 0
        ? product.ice_options[2] || product.ice_options[0] : ''

      const currentSizeImage = selectedSize?.name === '大杯' ? (product.large_image || '') : (product.medium_image || '')
      this.setData({ product, selectedSize, selectedSugar, selectedIce, loading: false, currentSizeImage })
      this.calcTotal()
    } catch {
      this.setData({ loading: false })
    }
  },

  onSizeSelect(e) {
    const size = e.currentTarget.dataset.size
    const product = this.data.product
    const currentSizeImage = size?.name === '大杯' ? (product.large_image || '') : (product.medium_image || '')
    this.setData({ selectedSize: size, currentSizeImage })
    this.calcTotal()
  },

  onSugarSelect(e) {
    this.setData({ selectedSugar: e.currentTarget.dataset.val })
  },

  onIceSelect(e) {
    this.setData({ selectedIce: e.currentTarget.dataset.val })
  },

  onAddonToggle(e) {
    const addon = e.currentTarget.dataset.addon
    let addons = [...this.data.selectedAddons]
    const idx = addons.findIndex(a => a.name === addon.name)
    if (idx >= 0) {
      addons.splice(idx, 1)
    } else {
      addons.push(addon)
    }
    this.setData({ selectedAddons: addons })
    this.calcTotal()
  },

  onQuantityChange(e) {
    const { type } = e.currentTarget.dataset
    let qty = this.data.quantity
    if (type === 'minus' && qty > 1) qty--
    if (type === 'plus' && qty < 99) qty++
    this.setData({ quantity: qty })
    this.calcTotal()
  },

  calcTotal() {
    const { product, selectedSize, selectedAddons, quantity } = this.data
    if (!product) return
    let price = parseFloat(product.base_price)
    if (selectedSize && selectedSize.price) price += parseFloat(selectedSize.price)
    selectedAddons.forEach(a => { price += parseFloat(a.price || 0) })
    this.setData({ totalPrice: (price * quantity).toFixed(2) })
  },

  isAddonSelected(addonName) {
    return this.data.selectedAddons.some(a => a.name === addonName)
  },

  onNoteInput(e) {
    this.setData({ itemNote: e.detail.value })
  },

  addToCart() {
    const { product, selectedSize, selectedSugar, selectedIce, selectedAddons, quantity, totalPrice, itemNote } = this.data
    if (!selectedSugar && product.sugar_options && product.sugar_options.length > 0) {
      wx.showToast({ title: '请选择糖度', icon: 'none' }); return
    }
    if (!selectedIce && product.ice_options && product.ice_options.length > 0) {
      wx.showToast({ title: '请选择冰度', icon: 'none' }); return
    }

    let unitPrice = parseFloat(product.base_price)
    if (selectedSize && selectedSize.price) unitPrice += parseFloat(selectedSize.price)
    selectedAddons.forEach(a => { unitPrice += parseFloat(a.price || 0) })

    const item = {
      product_id: product.id,
      product_name: product.name,
      product_image: product.image,
      unit_price: unitPrice.toFixed(2),
      size: selectedSize,
      sugar: selectedSugar,
      ice: selectedIce,
      addons: selectedAddons,
      quantity,
      item_note: itemNote || ''
    }
    console.log('Adding to cart:', JSON.stringify(item, null, 2))

    app.addToCart(item)
    wx.showToast({ title: '已加入购物车', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1000)
  }
})
