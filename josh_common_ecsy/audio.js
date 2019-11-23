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
        this.context = new window.AudioContext()
    }

    execute(delta) {
        this.queries.sounds.added.forEach(ent => {
            const sound = ent.getMutableComponent(SoundEffect)
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
        this.queries.playing.added.forEach(ent => {
            const sound = ent.getMutableComponent(SoundEffect)
            setTimeout(()=>{
                ent.removeComponent(PlaySoundEffect)
            },5)
            this.playSound(sound)
        })
    }

    playSound(sound) {
        const source = this.context.createBufferSource();
        source.buffer = sound.data
        source.connect(this.context.destination);
        source.start(0)
        return source
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


