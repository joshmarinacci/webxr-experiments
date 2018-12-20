window.AudioContext = window.AudioContext || window.webkitAudioContext


export default class AudioService {
    constructor(opts) {
        this.sounds = {}
        this.enabled = true
        if(opts && opts.enabled===false) this.enabled = false

        if(this.enabled) this.context = new window.AudioContext()
    }

    load(name, url) {
        return this.getAudioFile(url).then(buf => this.sounds[name] = buf)
    }
    play(name) {
        if(!this.enabled) return
        if(!this.sounds[name]) console.warn("could not find buffer for sound named ",name)
        return this.playSource(this.sounds[name])
    }
    getAudioFile(url) {
        return fetch(url,{responseType:'arraybuffer'})
            .then(resp => resp.arrayBuffer())
            .then(arr => {
                if(this.enabled) return this.context.decodeAudioData(arr)
                return false
            })
    }
    playSource(buffer) {
        if(!this.enabled) return
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start(0)
        return source
    }

}
