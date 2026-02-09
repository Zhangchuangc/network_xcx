// pages/home/home.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputVal: "",//搜索框内容
    goodsRecommend: [],//推荐商品
    kanjiaList: [],//砍价商品列表
    pingtuanList: [],//拼团商品列表
    loadingHidden: false,//loading
    selectCurrent: 0,
    categories: [],
    goods: [],
    loadingMoreHidden: true,
    coupons: [],
    curPage: 1,
    pageSize: 20,
  },

  tabClick(e) {
    const category = this.data.categories.find(ele => {
      return ele.id == e.currentTarget.dataset.id
    })

    if (category.vopCid1 || category.vopCid2) {
      wx.navigateTo({
        url: '/pages/goods/list-vop?cid1=' + (category.vopCid1 ? category.vopCid1 : '') + '&cid2' + (category.vopCid2 ? category.vopCid2 : ''),
      })
    } else {
      wx.setStorageSync('_categoryId', category.id)
      wx.switchTab({
        url: '/pages/category/category',
      })
    }
  },


  tabClickCms(e) {
    const category = this.data.cmsCategories[e.currentTarget.dataset.idx]
    wx.navigateTo({
      url: '/pages/cms/list?categoryId=' + category.id,
    })
  },

  toDetailsTap: function (e) {
    console.log(e);
    const id = e.currentTarget.dataset.id
    const supplytype = e.currentTarget.dataset.supplytype
    const yyId = e.currentTarget.dataset.yyId
    if (supplytype == 'cps_jd') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-detail/cps-jd?id=${id}`,
      })
    } else if (supplytype == 'vop_jd') {
      wx.navigateTo({
        url: `/pages/goods-details/vop?id=${yyId}&goodsId=${id}`,
      })
    } else if (supplytype == 'cps_pdd') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-details/cps-pdd?id=${id}`,
      })
    } else if (supplytype == 'cps_taobao') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-details/cps-taobao?id=${id}`,
      })
    } else {
      wx.navigateTo({
        url: `/pages/goods-details/index?id=${id}`,
      })
    }
  },
  tapBanner(e) {
    const item = e.currentTarget.dataset.item
    if (item.linkType == 1) {
      wx.navigateToMiniProgram({
        appId: item.appId,
        path: item.linkUrl || '',
      })
    } else {
      if (item.linkUrl) {
        wx.navigateTo({
          url: item.linkUrl,
        })
      }
    }
  },

  adClick: function (e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url: url,
      })
    }
  },

  bindTypeTap: function (e) {
    this.setData({
      selectCurrent: e.index
    })
  },


  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    wx.showShareMenu({ withShareTicket: true })

    this.handleInvite(options)

    const isLogined = await AUTH.checkHasLogined()
    if (isLogined) {
      TOOLS.showTabBarBadge()
    }

    await Promise.all([
      this.initBanners(),
      this.cmsCategories(),
      this.loadRecommendGoods(),
      this.getCoupons(),
      this.getNotice(),
      this.kanjiaGoods(),
      this.pingtuanGoods(),
      this.adPosition()
    ])

    this.readConfigVal()
  },


  readConfigVal() {
    const mallName = wx.getStorageSync('mallName')
    if (!mallName) return

    const config = {
      mallName,
      show_buy_dynamic: wx.getStorageSync('show_buy_dynamic'),
      hidden_goods_index: wx.getStorageSync('hidden_goods_index'),
    }

    this.setData(config)

    wx.setNavigationBarTitle({ title: mallName })

    this.categories()

    const shopMod = wx.getStorageSync('shopMod')
    const shopInfo = wx.getStorageSync('shopInfo')

    if (shopMod === '1' && !shopInfo) {
      wx.redirectTo({ url: '/pages/shop/select' })
    }
  },
  async miaoshaGoods() {
    const res = await WXAPI.goodsv2({
      miaosha: true
    })

    if (res.code == 0) {
      res.data.result.forEach(ele => {
        const _now = new Date().getTime()
        if (ele.dateStart) {
          ele.dateStartInt = new Date(ele.dateStart.replace(/-/g, '/')).getTime() - _now
        }
        if (ele.dateEnd) {
          ele.dateEndInt = new Date(ele.dateEnd.replace(/-/g, '/')).getTime() - _now
        }
      })
      this.setData({
        miaoshaGoods: res.data.result
      })
    }
  },

  async initBanners() {
    const _data = {}
    const res1 = await WXAPI.banners({
      type: 'index'
    })

    if (res1.code == 700) {
      wx.showModal({
        title: '提示',
        content: '请关闭',
        showCancel: false
      })
    } else {
      _data.banners = res1.data
    }
    this.setData(_data)

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
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject
    })
    this.setData({
      shopInfo: wx.getStorageSync('shopInfo')
    })

    TOOLS.showTabBarBadge()
    this.goodsDynamic()
    this.miaoshaGoods()
    const refreshIndex = wx.getStorageSync('refreshIndex')
    if (refreshIndex) {
      this.onPullDownRefresh()
      wx.removeStorageSync('refreshIndex')
    }
  },

  async goodsDynamic() {
    const res = await WXAPI.goodsDynamic(0)
    if (res.code == 0) {
      this.setData({
        goodsDynamic: res.data
      })
    }
  },

  async categories() {
    const res = await WXAPI.goodsCategory()
    let categories = [];
    if (res.code == 0) {
      const _categories = res.data.filter(ele => {
        return ele.level == 1
      })
      categories = categories.concat(_categories)
    }
    this.setData({
      categories: categories,
      curPage: 1
    });
    this.getGoodsList(0);
  },

  async getGoodsList(categoryId, appen) {
    if (categoryId == 0) {
      categoryId = "";
    }
    wx.showLoading({
      title: '',
    })

    const res = await WXAPI.goodsv2({
      categoryId: categoryId,
      page: this.data.curPage,
      pageSize: this.data.pageSize
    })

    wx.hideLoading()
    if (res.code == 404 || res.code == 700) {
      let newData = {
        loadingMoreHidden: false
      }
      if (!append) {
        newData.goods = []
      }
      this.setData(newData);
      return
    }
    let goods = [];
    if (append) {
      goods = this.data.goods
    }

    for (var i = 0; i < res.data.result.length; i++) {
      const item = res.data.result[i]
      const hidden_goods_index = wx.getStorageSync('hidden_goods_index')
      if (hidden_goods_index.indexOf(item.d) != -1) {
        continue
      }
      goods.push(item);
    }
    this.setData({
      loadingMoreHidden: true,
      goods: goods,
    });
  },

  getCoupons: function () {
    var that = this;
    WXAPI.coupons().then(function (res) {
      if (res.code == 0) {
        that.setData({
          cpupons: res.data
        });
      }
    })
  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage() {
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      path: '/pages/index/index?inviter_id=' + wx.getStorageSync('uid')
    }
  },

  onShareTimeline() {
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      query: 'inviter_id=' + wx.getStorageSync('uid'),
      imageUrl: wx.getStorageSync('share_pic')
    }
  },

  getNotice() {
    WXAPI.noticeList({ pageSize: 5 })
      .then(res => {
        if (res.code === 0) {
          this.setData({
            noticeList: res.data
          })
        }
      })
  },


  async kanjiaGoods() {
    const res = await WXAPI.goodsv2({
      kanjia: true
    });
    if (res.code == 0) {
      const kanjiaGOOdsIds = []
      res.data.result.forEach(ele => {
        kanjiaGOOdsIds.push(ele.id)
      })
      const goodsKnajiaSetRes = await WXAPI.kanjiaSet(kanjiaGOOdsIds.join())
      if (goodsKnajiaSetRes.code == 0) {
        res.data.result.forEach(ele => {
          const _process = goodsKnajiaSetRes.data.find(_set => {
            return _set.goodsId == ele.id
          })
          if (_process) {
            ele.process = 100 * _process.numberBuy / _process.number
            ele.process = ele.process.toFixed(0)
          }
        })
        this.setData({
          kanjiaList: res.data.result
        })
      }
    }
  },

  goCoupons:function(e){
    wx.switchTab({
      url:"/pages/coupons/index"
    })
  },

  pingtuanGoods(){
    const _this = this
    WXAPI.goodsv2({
      pingtuan:true
    }).then(res=>{
      if(res.code == 0){
        _this.setData({
          pingtuanList:res.data.result
        })
      }
    })
  },

  goSearch(){
    wx.navigateTo({
      url: '/pages/search/index'
    })
  },
  goNotice(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/notice/show?id=' + id,
    })
  },
async cmsCategories() {
    // https://www.yuque.com/apifm/nu0f75/slu10w
    const res = await WXAPI.cmsCategories()
    if (res.code == 0) {
      const cmsCategories = res.data.filter(ele => {
        return ele.type == 'index' // 只筛选类型为 index 的分类
      })
      this.setData({
        cmsCategories
      })
    }
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
    this.setData({
      curPage: 1
    });
    this.getGoodsList(0)
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.setData({
      curPage: this.data.curPage + 1
    });
    this.getGoodsList(0, true)
  },


})