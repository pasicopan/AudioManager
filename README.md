## AudioManager

- 一款小程序原生代码编写的背景音乐播放管理器,统一了资源管理，按需记录播放进度，通过事件分发同步全部界面的播放状态

### screenshot

![image](https://raw.githubusercontent.com/pasicopan/AudioManager/master/audiomanager.gif)

### wechat share snippet

[https://developers.weixin.qq.com/s/76Sq6Hm27A8d](https://developers.weixin.qq.com/s/76Sq6Hm27A8d)

### how to use

```javascript
const AudioManager = require("../../audioManager.js")
Component({
  data: {
    singer: "", // 歌手
    title: "", // 标题
    src: "", // 音频地址
    duration: "" // 音频时长
  },
  attached() {
    const { singer, title, src, duration } = this.data
    const cAudio = AudioManager.initAudio({
      singer, // 歌手
      title, // 标题
      src, // 音频地址
      duration // 音频时长
    })
  },
  methods: {
    togglePlayAudio() {
      const { title, src } = this.data
      const cAudio = AudioManager.setControllingAudio({
        title,
        src
      })
      if (!cAudio) return
      if (cAudio.paused) {
        AudioManager.play()
      } else {
        AudioManager.pause()
      }
    }
  }
})
```

### api

#### AudioManager // 音频管理器

- setControllingAudio // 配置一个音频对象，并设置为当前控制中，会返回一个 Audio 对象
- getControllingAudio //会返回一个当前控制中 Audio 对象
- play // 播放当前控制中的音频
- replay // 从头播放当前控制中的音频
- pause // 暂停当前控制中的音频

#### Audio // 音频对象

- reset// 重新配置一个音频播放对象
- addEvents("onSwitch", func)// 增加监听 [onSwitch:切换控制中的音频，onTimeUpdate, onPause, onPlay, onEnded]
- removeEvent("onSwitch", func)// 移除监听 [onSwitch:切换控制中的音频，onTimeUpdate, onPause, onPlay, onEnded]
