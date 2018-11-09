class Tween {
    constructor() {
        this.running = false
    }
    update(time) {
        throw new Error("update not implemented")
    }
    start() {
        this.running = true
    }
    isAlive() {
        return this.running
    }
    kill() {
        this.running = false
    }
}

class WaitTween extends Tween {
    constructor(dur) {
        super()
        this.type = 'wait'
        this.duration = dur
    }
    update(time) {
        time = time/1000
        if(!this.startTime) this.startTime = time
        const diff = time - this.startTime
        let t = diff/this.duration
        if(t >= 1) {
            this.running = false
        }
    }
}

class ActionTween extends Tween {
    constructor(fn) {
        super()
        this.type = 'action'
        this.fn = fn
    }
    start() {
        const res = this.fn()
        this.running = false
        return res
    }
}

class ForeverTween extends Tween {
    constructor(fn) {
        super()
        this.type = 'forever'
        this.fn = fn
    }
    start() {
        this.running = true
        this.startTime = Date.now()/1000
    }
    update(time) {
        const diff = time/1000 - this.startTime
        this.fn(diff)
    }
}

export const PROP_TYPES = {
    SINGLE:'single',
    COMPOUND:'compound',
}
export const LERP_TYPES = {
    LINEAR:'linear',
    ELASTIC:'elastic'
}

function easeOutElastic(t) {
    var p = 0.3;
    return Math.pow(2,-10*t) * Math.sin((t-p/4)*(2*Math.PI)/p) + 1;
}
function easeLinear(from,to,t) {
    return (to - from) * t + from
}
class PropTween extends Tween {
    constructor(opts) {
        super()
        this.type = 'prop'
        this.target = opts.target
        this.duration = opts.duration
        if(typeof this.duration === 'undefined') throw new Error("duration is missing")
        this.property = opts.property
        if(typeof this.property === 'undefined') throw new Error("property is missing")
        this.propertyType = opts.propertyType || PROP_TYPES.SINGLE
        this.from = opts.from
        this.to = opts.to
        this.lerp_type = opts.lerpType || LERP_TYPES.LINEAR

        this.loop = opts.loop
        if(typeof this.loop === 'undefined') this.loop = 1
        this.loopCount = 0
        this.reversed = false
        this.autoReverse = opts.autoReverse
        if(typeof this.autoReverse === 'undefined') this.autoReverse = false
    }
    update(time) {
        time = time/1000
        if(!this.startTime) this.startTime = time
        const diff = time - this.startTime

        let t = diff/this.duration
        if(t > 1.0) {
            t = 1.0
        }
        this.setPropertyValue(this.from,this.to,this.reversed?(1-t):t)
        if(t === 1.0) {
            this.loopCount++
            if(this.autoReverse) {
                this.reversed = !this.reversed
            }
            if(this.loop !== -1) {
                if(this.loopCount >= this.loop) {
                    this.running = false
                    return
                }
            }
            this.startTime = time
        }
    }

    setPropertyValue(from,to,t,target,name) {
        if(this.propertyType === PROP_TYPES.SINGLE) {
            this.target[this.property] = this.lerp(this.from, this.to, this.reversed ? (1 - t) : t)
        }
        if(this.propertyType === PROP_TYPES.COMPOUND) {
            Object.keys(this.from).forEach(name => {
                this.target[this.property][name] = this.lerp(this.from[name], this.to[name], this.reversed ? (1 - t) : t)
            })
        }
    }

    lerp(from,to,t) {
        if(this.lerp_type === LERP_TYPES.LINEAR)  return easeLinear(from,to,t)
        if(this.lerp_type === LERP_TYPES.ELASTIC) return easeLinear(from,to,easeOutElastic(t))
        console.log("invalid LERP_TYPE")
        return from
    }
}

class ClipTween extends Tween {
    constructor(opts) {
        super()
        this.type = 'clip'
        this.target = opts.target
        this.name = opts.name
        this.loop = opts.loop
        this.autoReverse = opts.autoReverse
        if(typeof this.autoReverse === 'undefined') this.autoReverse = false
        if(typeof this.loop === 'undefined') this.loop = 1
        if(typeof this.name === 'undefined') throw new Error("name is missing")
        this.speed = opts.speed
        if(typeof this.speed === 'undefined') this.speed = 1
    }
    start() {
        this.running = true
        this.mixer = new THREE.AnimationMixer(this.target.scene)
        this.action = this.mixer.clipAction(THREE.AnimationClip.findByName(this.target.animations,this.name))
        if(this.loop === 1) {
            this.action.setLoop(THREE.LoopOnce, 1)
        }
        if(this.loop === -1) {
            this.action.setLoop(this.autoReverse?THREE.LoopPingPong:THREE.LoopRepeat, Infinity)
        }
        if(this.loop > 1) {
            this.action.setLoop(THREE.LoopRepeat, this.loop)
        }
        this.action.play()
        this.action.setEffectiveTimeScale(this.speed)
        this.startTime = Date.now()/1000
        this.prevTime = this.startTime
    }
    update(time) {
        const diff = time/1000 - this.prevTime
        this.mixer.update(diff)
        this.prevTime = time/1000
    }
    kill() {
        this.action.stop()
        this.running = false
    }
}

class ParallelTween extends Tween {
    constructor() {
        super()
        this.subs = []
    }
    and(obj) {
        if(obj instanceof Tween) {
            this.subs.push(obj)
        } else {
            this.subs.push(new ActionTween(obj))
        }
        return this
    }
    start() {
        // console.log("starting parallel")
        this.running = true
        this.subs.forEach(s=>s.start())
        // console.log('started')
        // console.log(this.subs)
        return this
    }
    update(time) {
        this.subs.forEach(s => {
            if(s.isAlive()) s.update(time)
        })
    }
    isAlive() {
        const first = this.subs.find(s => s.isAlive() === true)
        // console.log("first alive is",first)
        return first !== undefined
    }
}

class SequentialTween extends Tween {
    constructor() {
        super()
        this.subs = []
        this.n = -1
    }
    then(obj) {
        if(obj instanceof Tween) {
            this.subs.push(obj)
        } else {
            this.subs.push(new ActionTween(obj))
        }
        return this
    }
    wait(dur) {
        this.subs.push(new WaitTween(dur))
        return this
    }
    start() {
        this.running = true
        this._startNext()
        return this
    }
    _startNext() {
        this.n = this.n + 1

        //if at the end of everything
        if(this.n > this.subs.length-1) {
            this.running = false
            this.n = -1
            return null
        }


        const cur = this.subs[this.n]
        const res = cur.start()
        if(!cur.isAlive()) {
            if(res) {
                console.log("the next swapped itself", res)
                //swap in the result
                this.subs[this.n] = res
                //backup
                this.n = this.n -1
                //recurse
                return this._startNext()
            } else {
                // console.log("the next didn't swap. just move on")
                return this._startNext()
            }
        }
        return cur
    }
    update(time) {
        // console.log('updating')
        const cur = this.subs[this.n]
        cur.update(time)
        // console.log("updated cur",cur, cur.isAlive())
        if(!cur.isAlive()) this._startNext()

    }
    isAlive() {
        const first = this.subs.find(s => s.isAlive() === true)
        // console.log("first alive is",first)
        // console.log(this.subs)
        return first !== undefined
    }
}

class T2 {
    constructor() {
        this.subs = []
    }
    parallel() {
        const t = new ParallelTween()
        this.subs.push(t)
        return t
    }
    sequence() {
        const t =  new SequentialTween()
        this.subs.push(t)
        return t
    }
    action(fn) {
        const t = new ActionTween(fn)
        this.subs.push(t)
        return t
    }
    prop(opts) {
        const t = new PropTween(opts)
        this.subs.push(t)
        return t
    }
    isAlive() {
        return this.subs.find((s => s.isAlive() === true))
    }
    update() {
        const now = Date.now()
        this.subs.forEach(s => {
            if(s.isAlive()) s.update(now)
        })
    }
    forever(fn) {
        const t = new ForeverTween(fn)
        this.subs.push(t)
        return t
    }
    clip(opts) {
        const t = new ClipTween(opts)
        this.subs.push(t)
        return t
    }
    wait(dur) {
        const t = new WaitTween(dur)
        this.subs.push(t)
        return t
    }
}

export const t2 = new T2();

/*

const obj = { x: -1, y: -1, z: 0, w: 0}

const para = t2.parallel()
    .and(t2.prop({ target:obj, property:'x', from:10, to:0, duration: 1}))
    .and(()=>console.log("inside the parallel action"))
    .start()

const seq = t2.sequence()
    .then(()=>console.log("first is an action"))
    .then(t2.prop({ target:obj, property:'y', from:10, to:0, duration: 1}))
    .then(()=> console.log("inside the sequential action"))
    .then(t2.prop({target:obj, property:'y', from:0, to:10, duration:1 }))
    .then(()=>{
        console.log("done with part 1. calculating part 2")
        return t2.prop({target:obj, property:'x', from: 0, to:-8, duration:1})
    })
    .then(() => {
        console.log("now we're going to insert a new parallel tween")
        return t2.parallel()
            .and(t2.prop({target:obj, property:'z', from:-1,to:1, duration:1}))
            .and(t2.prop({target:obj, property:'w', from:-1,to:1, duration:1}))
    })
    .start()

function update() {
    console.log("tick")
    t2.update()
    console.log(obj)
    if(t2.isAlive()) {
        setTimeout(update,250)
    } else {
        console.log("done with everything. check it out!")
        console.log(obj.z === 1)
    }
}
update()
*/