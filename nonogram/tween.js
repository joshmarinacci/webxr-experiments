function lerp(min,max,t) {
    return min + (max-min)*t
}
class Tween {
    constructor(group, cfg) {
        this.group = group
        this.target = cfg.target
        this.property = cfg.property
        this.from = cfg.from
        this.to = cfg.to
        this.duration = cfg.duration
        this.started = false
        this.ended = false
        this.current = -1
        this._onEnd = cfg.onEnd
    }
    tick(time) {
        if(this.ended) return
        if(!this.started) {
            this.started = true
            this.startTime = time
            this.current = 0
        }

        this.current = (time-this.startTime)/this.duration
        this.target[this.property] = lerp(this.from,this.to,this.current)

        if(this.current >= 1) {
            this.ended = true
            this.target[this.property] = lerp(this.from,this.to,1)
            if(this._onEnd) {
                this._onEnd()
            }
            this.group.end(this)
        }
    }
    onEnd(cb) {
        this._onEnd = cb
        return this
    }
}
class TweenGroup {
    constructor() {
        this.active = []
    }
    tick(time) {
        this.active.forEach(tween=>tween.tick(time))
    }
    make(cfg) {
        const tween = new Tween(this,cfg)
        this.active.push(tween)
        return tween
    }
    end(tween) {
        this.active = this.active.filter(t => t !== tween)
    }
}

export const TWEEN = new TweenGroup()


