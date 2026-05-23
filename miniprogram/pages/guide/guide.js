const API_BASE = 'https://api.xianshihuodong.xyz'

Page({
  data: {
    qrcodes: {
      wechat_group_qrcode: '',
      wechat_pay_qrcode: ''
    }
  },

  onLoad() {
    this.loadSettings()
  },

  // 获取设置（包含二维码）
  loadSettings() {
    wx.request({
      url: `${API_BASE}/api/settings`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          const data = res.data.data
          // 拼接完整图片 URL
          const getFullUrl = (url) => url ? (url.startsWith('http') ? url : API_BASE + url) : ''
          this.setData({
            qrcodes: {
              wechat_group_qrcode: getFullUrl(data.wechat_group_qrcode),
              wechat_pay_qrcode: getFullUrl(data.wechat_pay_qrcode)
            }
          })
        }
      }
    })
  },

  // 预览二维码
  previewQrcode(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      })
    }
  },

  goOrder() {
    wx.navigateBack()
  }
})
