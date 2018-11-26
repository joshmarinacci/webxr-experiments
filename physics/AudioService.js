window.AudioContext = window.AudioContext || window.webkitAudioContext
let context = new window.AudioContext()


export default class AudioService {
    constructor() {
        this.sounds = {}
    }

    load(name, url) {
        return this.getAudioFile(url).then(buf => {
            this.sounds[name] = buf
        })
    }
    play(name) {
        if(!this.sounds[name]) console.warn("could not find buffer for sound named ",name)
        return this.playSource(this.sounds[name])
    }
    getAudioFile(url) {
        return fetch(url,{responseType:'arraybuffer'})
            .then(resp => resp.arrayBuffer())
            .then(arr => context.decodeAudioData(arr))
    }
    playSource(buffer) {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0)
        return source
    }

}
