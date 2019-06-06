const BAM = wx.getBackgroundAudioManager()
// TODO: other event
const EVENTLIST = [
  "onCanplay",
  "onWaiting",
  "onStop",
  "onTimeUpdate",
  "onPlay",
  "onEnded",
  "onPause"
]
let id = 0
let PAUSEFROMSRC = null
class AudioController {
  currentTime = 0
  duration = 0
  ended = true
  paused = true
  waiting = true
  options = {}
  events = {
    onSwitchSet: new Set(),
    onPlaySet: new Set(),
    onStopSet: new Set(),
    onPauseSet: new Set(),
    onTimeUpdateSet: new Set(),
    onCanplaySet: new Set(),
    onWaitingSet: new Set(),
    onEndedSet: new Set()
  }
  constructor(options = {}) {
    this.id = id++
    // console.log("constructor,options=", options)
    this.options = { ...this.options, ...options }
    this.reset()
  }
  reset(_options) {
    // console.log("reset")
    const { currentTime = 0, duration = 0 } = _options || this.options
    this.duration = duration
    this.currentTime = currentTime
    this.ended = true
    this.paused = true
    this.waiting = true
  }
  addEvent(event, cb) {
    // console.log("addEvent", event, cb)
    this.events[`${event}Set`].add(cb)
  }
  removeEvent(event, cb) {
    // console.log("removeEvent", event, cb)
    this.events[`${event}Set`].delete(cb)
  }
  onSwitch(isControlling) {
    console.log("AudioController onSwitch,isControlling=", isControlling)
    this.events.onSwitchSet.forEach(f => {
      f(isControlling)
    })
  }
  onPlay() {
    this.waiting = false
    this.paused = false
    console.log("AudioController onPlay")
    this.events.onPlaySet.forEach(f => {
      f()
    })
  }
  onStop() {
    console.log("AudioController onStop")
    this.onStop = true
    this.paused = true
    this.events.onStopSet.forEach(f => {
      f()
    })
  }
  onPause() {
    console.log("AudioController onPause")
    this.paused = true
    this.events.onPauseSet.forEach(f => {
      f()
    })
  }
  onTimeUpdate() {
    this.waiting = false
    this.currentTime = BAM.currentTime || 0
    // console.log("AudioController onTimeUpdate=", this.currentTime)
    this.events.onTimeUpdateSet.forEach(f => {
      f()
    })
  }
  onCanplay() {
    console.log("AudioController onCanplay=", BAM.duration)
    this.events.onCanplaySet.forEach(f => {
      f()
    })
  }
  onWaiting() {
    this.waiting = true
    console.log("AudioController onWaiting=", BAM.duration)
    this.events.onWaitingSet.forEach(f => {
      f()
    })
  }
  onEnded() {
    this.ended = true
    this.paused = true
    console.log("AudioController onEnded")
    this.events.onEndedSet.forEach(f => {
      f()
    })
  }
}

class Bam {
  playingAudioMap = new Map()
  controllingAudio = null
  preControlAudio = null
  constructor() {
    EVENTLIST.forEach(event => {
      BAM[event](() => {
        // console.warn(`Bam event:${event}`, this.controllingAudio)
        if (this.controllingAudio === null || !this.controllingAudio[event])
          return
        // onPause 可能是非当前播放中的一个音频的暂停事件，这里需要重新找回暂停源的音频
        if (event === "onPause" && PAUSEFROMSRC !== null) {
          this.find(PAUSEFROMSRC).onPause()
          PAUSEFROMSRC = null
          // console.warn("切换音频后，正确回调音频的onPause 方法")
        } else {
          // PAUSEFROMSRC===null 时直接调用当前播放中的音频
          this.controllingAudio[event]()
        }
      })
    })
  }
  // 背景音频只有单一播放源，这里统一播放接口
  // 续播
  play() {
    console.log("Bam play")
    this.replay()
    BAM.pause()
    // FIXME: ios 需要setTimeout 才能使seek 生效，开发工具不需要。会有一些误差
    setTimeout(() => {
      BAM.seek(this.controllingAudio.currentTime)
      BAM.play()
    }, 50)
  }
  // 从头播
  replay() {
    if (!this.controllingAudio) {
      console.warn(
        "call play or replay method after setControllingAudio method"
      )
      return
    }
    ;["title", "epname", "singer", "coverImgUrl", "src"].forEach(key => {
      BAM[key] = this.controllingAudio.options[key] || ""
    })
    this.controllingAudio.ended = false
    this.controllingAudio.paused = false
  }
  pause() {
    if (!this.controllingAudio) {
      console.warn("call pause method after setControllingAudio method")
      return
    }
    console.log("Bam pause")
    this.controllingAudio.currentTime = BAM.currentTime || 0
    BAM.pause()
    PAUSEFROMSRC = this.controllingAudio.options.src
    this.controllingAudio.paused = true
  }
  setControllingAudio(options) {
    const { src } = options

    let controllingAudio = this.find(src)
    const isSwitchNewControllingAudio =
      this.controllingAudio !== controllingAudio
    if (isSwitchNewControllingAudio) {
      this.preControlAudio = this.controllingAudio
      this.pause()
      // setControllingAudio return 后再触发onSwitch
      setTimeout(() => {
        this.preControlAudio && this.preControlAudio.onSwitch(false)
      }, 0)
    }
    if (controllingAudio === null) {
      controllingAudio = this.initAudio(options)
    }
    this.controllingAudio = controllingAudio
    if (isSwitchNewControllingAudio) {
      // setControllingAudio return 后再触发onSwitch
      setTimeout(() => {
        this.controllingAudio.onSwitch(true)
      }, 0)
    }
    return controllingAudio
  }
  getControllingAudio() {
    return this.controllingAudio
  }
  find(src) {
    return this.playingAudioMap.get(src) || null
  }
  initAudio(options = {}) {
    const { src = "" } = options
    const old = this.playingAudioMap.get(src)
    if (old) {
      return old
    } else {
      const ac = new AudioController(options)
      this.playingAudioMap.set(src, ac)
      return ac
    }
  }
}
module.exports = new Bam()
