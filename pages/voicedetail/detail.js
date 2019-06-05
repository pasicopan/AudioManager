const { list } = require("../../music.js")

Page({
  data: {
    item: null,
    list
  },
  onLoad(options) {
    const { id } = options
    this.setData({
      item: this.data.list[id]
    })
  }
})
