import {System} from "https://ecsy.io/build/ecsy.module.js"

export class SoundEffect {
    constructor() {
        this.loop = false
        this.autoPlay = false
    }
}

export class PlaySoundEffect {
}

export class AudioSystem extends System {
    init() {
        this.audioReady = false
        this.callbacks = []
        window.addEventListener('touchstart',()=> this.startAudio())
        window.addEventListener('click',()=> this.startAudio())
    }

    execute(delta) {
        this.queries.sounds.added.forEach(ent => {
            const sound = ent.getMutableComponent(SoundEffect)
            this.whenReady(()=>{
                return fetch(sound.src,{responseType:'arraybuffer'})
                    .then(resp => resp.arrayBuffer())
                    .then(arr => {
                        return this.context.decodeAudioData(arr)
                    })
                    .then(data => {
                        sound.data = data
                        if(sound.autoPlay) {
                            this.playSound(sound)
                        }
                    })
            })
        })
        this.queries.playing.added.forEach(ent => {
            const sound = ent.getMutableComponent(SoundEffect)
            setTimeout(()=>{
                ent.removeComponent(PlaySoundEffect)
            },5)
            this.whenReady(()=>{
                this.playSound(sound)
            })
        })
    }

    playSound(sound) {
        const source = this.context.createBufferSource();
        source.buffer = sound.data
        if(sound.loop) source.loop = true
        source.connect(this.context.destination);
        source.start(0)
        return source
    }

    whenReady(cb) {
        if(this.audioReady) {
            cb()
        } else {
            this.callbacks.push(cb)
        }
    }

    startAudio() {
        if(this.audioReady) return
        this.audioReady = true
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext) {
            document.querySelector('#info-alert').innerHTML = `making`
            window.audioContext = new window.AudioContext();
        }
        this.callbacks.forEach(cb => cb())
        this.callbacks = null
        document.querySelector('#info-alert').innerHTML = `made`
        console.log("enabled audio")
    }
}


AudioSystem.queries = {
    sounds: {
        components:[SoundEffect],
        listen: {
            added: true,
            removed: true
        }
    },
    playing: {
        components: [SoundEffect, PlaySoundEffect],
        listen: {
            added: true,
            removed: true
        }
    }
}


