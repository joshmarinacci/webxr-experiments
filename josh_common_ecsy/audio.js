import {System} from "https://ecsy.io/build/ecsy.module.js"

export class SoundEffect {
    constructor() {
        this.loop = false
        this.autoPlay = false
    }
}

export class PlaySoundEffect {
}

function decodeAudioData(ctx,arr) {
    return new Promise((res,rej)=>{
        ctx.decodeAudioData(arr,(retval)=>{
            console.log("success")
            res(retval)
        },(e)=>{
            console.log("error",e)
            rej(e)
        })
    })
}

export class AudioSystem extends System {
    init() {
        this.audioReady = false
        this.callbacks = []
        window.addEventListener('touchstart',()=> this.startAudio())
        window.addEventListener('touchend',()=> this.startAudio())
        window.addEventListener('click',()=> this.startAudio())
    }

    execute(delta) {
        this.queries.sounds.added.forEach(ent => {
            const sound = ent.getMutableComponent(SoundEffect)
            this.whenReady(()=>{
                return fetch(sound.src,{responseType:'arraybuffer'})
                    .then(resp => resp.arrayBuffer())
                    .then(arr => {
                        return decodeAudioData(this.context,arr)
                    })
                    .then(data => {
                        sound.data = data
                        if(sound.autoPlay) {
                            this.playSound(sound)
                        }
                    })
                    .catch((e) => {
                        console.log("error",e)
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
        console.log("startring", sound.src)
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
        console.log("initing audio")
        this.audioReady = true
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext) {
            this.context = new window.AudioContext();
            // Create empty buffer
            var buffer = this.context.createBuffer(1, 1, 22050);
            var source = this.context.createBufferSource();
            source.buffer = buffer;
            // Connect to output (speakers)
            source.connect(this.context.destination);
            // Play sound
            if (source.start) {
                source.start(0);
            } else if (source.play) {
                source.play(0);
            } else if (source.noteOn) {
                source.noteOn(0);
            }
        }
        this.callbacks.forEach(cb => cb())
        this.callbacks = null
        this.log("audio enabled")
    }
    log(str) {
        console.log("LOG: ",str)
        const sel = document.querySelector('#info-alert')
        if(sel) sel.innerHTML = str
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


