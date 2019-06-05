const AudioManager = require("../../audioManager.js")
/**
 * 音频播放
 * 1、未播放时：点击播放。2、播放未加载出来时：正在缓存3、播放中：正在播放，已经暂停两种状态。4、播放完成变回1
 */
function getStatusText(cAudio) {
  const { paused, waiting, ended } = cAudio
  // console.log("getStatusText,cAudio=", cAudio, paused, waiting, ended)
  if (ended) {
    return "点击播放"
  } else if (paused) {
    return "已经暂停"
  } else if (waiting) {
    return "正在缓冲"
  } else {
    return "正在播放"
  }
}

function getCurrentTimeWidthPercent(cAudio) {
  return Math.round((cAudio.currentTime * 100) / cAudio.duration)
}
function throttle(fn, threshhold) {
  // 记录上次执行的时间
  var last

  // 定时器
  var timer

  // 默认间隔为 250ms
  threshhold || (threshhold = 250)

  // 返回的函数，每过 threshhold 毫秒就执行一次 fn 函数
  return function() {
    // 保存函数调用时的上下文和参数，传递给 fn
    var context = this
    var args = arguments

    var now = +new Date()

    // 如果距离上次执行 fn 函数的时间小于 threshhold，那么就放弃
    // 执行 fn，并重新计时
    if (last && now < last + threshhold) {
      clearTimeout(timer)

      // 保证在当前时间区间结束后，再执行一次 fn
      timer = setTimeout(function() {
        last = now
        fn.apply(context, args)
      }, threshhold)

      // 在时间区间的最开始和到达指定间隔的时候执行一次 fn
    } else {
      last = now
      fn.apply(context, args)
    }
  }
}
Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },
  data: {
    cAudio: null,
    paused: true,
    statusText: "点击播放",
    timeText: "",
    currentTimeWidthPercent: 0,
    audioContainerWidth: 400
  },
  attached() {
    // console.log("attached=", this.data.item)
    const { singer, duration, title, src } = this.data.item
    const timeText = this.getTimeText(duration)
    const cAudio = AudioManager.initAudio({
      singer,
      title,
      src,
      duration
      // currentTime: duration - 5
    })

    // 语音长度，最短400px，最长560px，7分钟以下及7分钟就是最短。11分钟以上为最长，中间区间自动适配
    // 400+(duration-7*60)*(560-400)/(11*60)
    const audioContainerWidth =
      this.data.audioContainerWidth +
      ((duration - 7 * 60) * (560 - 400)) / (11 * 60)

    const _updateStatusText = () => {
      this.setData({
        currentTimeWidthPercent: getCurrentTimeWidthPercent(cAudio),
        statusText: getStatusText(cAudio)
      })
    }
    const throttleUpdateStatusText = throttle(_updateStatusText, 2000)
    const updateStatusText = () => {
      if (this.data.statusText === getStatusText(cAudio)) {
        throttleUpdateStatusText()
      } else {
        _updateStatusText()
      }
    }
    const reset = isControlling => {
      // 是否当前播放中
      if (isControlling) return
      // 不是当前播放，回到默认状态
      cAudio.reset()
      this.setData({
        currentTimeWidthPercent: getCurrentTimeWidthPercent(cAudio),
        statusText: getStatusText(cAudio)
      })
    }
    updateStatusText()
    this.setData(
      {
        cAudio,
        timeText,
        audioContainerWidth,
        updateStatusText,
        reset
      },
      this.addEvents
    )
  },
  detached() {
    this.removeEvents()
  },
  pageLifetimes: {
    // 从后台返回需要更新状态
    show() {
      this.setData({ statusText: getStatusText(this.data.cAudio) })
    }
  },
  methods: {
    getTimeText(duration) {
      const s = duration % 60
      const m = Math.floor(duration / 60)
      let timeText = `${s}′′`
      if (m > 0) {
        timeText = `${m}′${timeText}`
      }
      return timeText
    },

    addEvents() {
      const { cAudio } = this.data
      cAudio.addEvent("onSwitch", this.data.reset)
      cAudio.addEvent("onTimeUpdate", this.data.updateStatusText)
      cAudio.addEvent("onPause", this.data.updateStatusText)
      cAudio.addEvent("onPlay", this.data.updateStatusText)
      cAudio.addEvent("onEnded", this.data.updateStatusText)
    },
    removeEvents() {
      const { cAudio } = this.data
      cAudio.removeEvent("onSwitch", this.data.reset)
      cAudio.removeEvent("onTimeUpdate", this.data.updateStatusText)
      cAudio.removeEvent("onPause", this.data.updateStatusText)
      cAudio.removeEvent("onPlay", this.data.updateStatusText)
      cAudio.removeEvent("onEnded", this.data.updateStatusText)
    },
    togglePlayAudio() {
      const { title, src } = this.data.item
      console.log("togglePlayAudio=", title, src)
      const cAudio = AudioManager.setControllingAudio({
        title,
        src
      })
      // console.log("cAudio=", cAudio)
      if (!cAudio) return
      if (cAudio.paused) {
        AudioManager.play()
      } else {
        AudioManager.pause()
      }
    }
  }
})
