class Tweenie {
    constructor(opts) {
        this.target = opts.target
        this.shouldStart = false
        this.startTime = -1
        this.running = false
        this.duration = opts.duration
        this.props = opts.props || {}
        this.interpolation = opts.interpolation || this.lerp
        this.onEndHandler = opts.onEnd || (() => {
            // console.log("doing nothing for on end")
        })
    }
    start() {
        this.shouldStart = true
        return this
    }
    onEnd(cb) {
        this.onEndHandler = cb
        return this
    }
    lerp(from,to,t) {
        // console.log("lerp",from,to,t)
        return (to-from)*t + from
    }
    update(time) {
        if(this.shouldStart){
            this.startTime = time
            this.shouldStart = false
            this.running = true
        }

        if(!this.running) return

        const elapsed = (time - this.startTime)/1000
        if(elapsed > this.duration) {
            this.running = false
            this.onEndHandler(this)
            return
        }

        const t = elapsed/this.duration
        Object.keys(this.props).forEach(prop => {
            const val = this.target[prop]
            const settings = this.props[prop]
            const lerp = this.interpolation
            if(val instanceof THREE.Vector3) {
                val.x = lerp(settings.from.x, settings.to.x,t,this)
                val.y = lerp(settings.from.y, settings.to.y,t,this)
                val.z = lerp(settings.from.z, settings.to.z,t,this)
                return
            }
            console.error("can't lerp ",val)
        })
    }
    stop() {
        this.running = false
        return this
    }
}
Tweenie.Lerp = function(a,b,t) { return (b-a)*t + a }
Tweenie.LINEAR = "LINEAR"
Tweenie.JITTER = "JITTER"


class ParallelTweenie {
    constructor(tweens) {
        this.subTweens = tweens
        this.running = false
    }
    start() {
        this.subTweens.forEach(tw => tw.start())
        this.running = true
    }
    update(time) {
        if(!this.running) return
        this.subTweens.forEach(tw => tw.update(time))
    }
}
