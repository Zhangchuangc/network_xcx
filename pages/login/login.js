// pages/login/login.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
  },


  xieyiChange(e) {
    console.log(e),
      this.setData({
        checked: e.detail,
      })
  },

  goxieyi(e) {
    wx.navigateTo({
      url: '/pages/about/index?key=' + e.currentTarget.dataset.key,
    })
  },

  showModel2() {
    wx.showModal({
      title: '温馨提示',
      content: '已经阅读并同意《用户协议》、《隐私协议》',
      cancelText: '不同意',
      confirmText: '同意',
      success: res => {
        if (res.confirm) {
          this.setData({
            checked: true
          })
        }
      }
    }
    )
  },
  showModal(action) {
    wx.showModal({
      title: '温馨提示',
      content: '已经阅读并同意《用户协议》、《隐私协议》',
      cancelText: '不同意',
      confirmText: '同意',
      success: res => {
        if (res.confirm) {
          this.setData({
            checked: true
          })
          if (action == 'loginOne') {
            this.loginOne()
          }
        }
      }
    })
  },

  async loginOne(){
    if(!this.data.checked){
      this.showModal('longOne')
      return
    }
    const res = await AUTH.login20241025()
    if (res.code == 10000) {
      // 用户不存在
      wx.showModal({
        content: '您还未注册，请使用《手机号安全登陆》方式登陆',
        showCancel: false
      })
      return
    }
    if (res.code != 0) {
      // 登录错误
      return
    }
    wx.reLaunch({
      url:'/pages/index/index',
    })
  },




  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})