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
        console.log("running the sub function")
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
class PropTween extends Tween {
    constructor(opts) {
        super()
        this.type = 'prop'
        this.target = opts.target
        this.duration = opts.duration
        if(typeof this.duration === 'undefined') throw new Error("duration is missing")
        this.property = opts.property
        if(typeof this.property === 'undefined') throw new Error("property is missing")
        this.from = opts.from
        this.to = opts.to

        this.loop = opts.loop
        if(typeof this.loop === 'undefined') this.loop = 1
        this.loopCount = 0
    }
    update(time) {
        time = time/1000
        if(!this.startTime) this.startTime = time
        const diff = time - this.startTime

        let t = diff/this.duration
        if(t > 1.0) {
            t = 1.0
        }
        const v = this.lerp(this.from, this.to, t)
        this.target[this.property] = v
        if(t == 1.0) {
            this.loopCount++
            if(this.loop !== -1) {
                if(this.loopCount >= this.loop) {
                    this.running = false
                    return
                }
            }
            this.startTime = time
        }
    }

    lerp(from,to,t) {
        return (to-from)*t + from
    }
}

class ClipTween extends Tween {
    constructor(opts) {
        super()
        this.type = 'clip'
        this.target = opts.target
        this.name = opts.name
        if(typeof this.name === 'undefined') throw new Error("name is missing")
    }
    start() {
        this.running = true
        this.mixer = new THREE.AnimationMixer(this.target.scene)
        this.action = this.mixer.clipAction(THREE.AnimationClip.findByName(this.target.animations,this.name))
        // this.action.setLoop(THREE.LoopPingPong)
        this.action.play()
        // this.action.setEffectiveTimeScale(-0.3)
        this.startTime = Date.now()/1000
        this.prevTime = this.startTime
    }
    update(time) {
        const diff = time/1000 - this.prevTime
        this.mixer.update(diff)
        this.prevTime = time/1000
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
                console.log("the next didn't swap. just move on")
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