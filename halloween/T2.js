const util = require('util')
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

class ActionTween extends Tween {
    constructor(fn) {
        super()
        this.type = 'action'
        this.fn = fn
    }
    start() {
        console.log("running the sub function")
        this.fn()
        this.running = false
    }
}

class PropTween extends Tween {
    constructor(opts) {
        super()
        this.type = 'prop'
        this.target = opts.target
        this.duration = opts.duration
        this.property = opts.property
        this.from = opts.from
        this.to = opts.to
    }
    update(time) {

        time = time/1000
        if(!this.startTime) this.startTime = time
        const diff = time - this.startTime

        const t = diff/this.duration
        const v = this.lerp(this.from, this.to, t)
        this.target[this.property] = v
        if(t > 1.0) {
            this.running = false
        }
    }

    lerp(from,to,t) {
        return (to-from)*t + from
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
        this.n = 0
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
        const cur = this.subs[this.n]
        cur.start()
        return this
    }
    update(time) {
        console.log('updating')
        const cur = this.subs[this.n]
        cur.update(time)
        // console.log("updated cur",cur, cur.isAlive())

        if(!cur.isAlive()) {
            console.log("going to the next")
            while(true) {
                this.n = this.n + 1
                if(this.n > this.subs.length-1) {
                    this.running = false
                    this.n = -1
                    break
                }
                const next = this.subs[this.n]
                next.start()
                if(next.isAlive()) break
            }
            /*
            if(this.n < this.subs.length-1) {
                console.log("really next")
                this.n = this.n + 1
                const next = this.subs[this.n]
                next.start()
                //if this was an action, then need to go to the
                //next one
                if(!next.isAlive()) {
                    this.n = this.n+1
                    next = this.subs[this.n]
                    next.start()
                }
            } else {
                console.log("fully done")
                this.running = false
                this.n = -1
            }*/
        }
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
}



const t2 = new T2()
// const act = t2.action(()=>console.log("action is running"))
// act.start()

const obj = { x: -1, y: -1}

// const prop = t2.prop({
//     target:obj,
//     property:'x',
//     from:0,
//     to:10,
//     duration:1 })
// prop.start()

const para = t2.parallel()
    .and(t2.prop({ target:obj, property:'x', from:10, to:0, duration: 1}))
    .and(()=>console.log("inside the parallel action"))
    .start()

const seq = t2.sequence()
    .then(t2.prop({ target:obj, property:'y', from:10, to:0, duration: 1}))
    .then(()=> console.log("inside the sequential action"))
    .then(t2.prop({target:obj, property:'y', from:0, to:10, duration:1 }))
    .start()

function update() {
    console.log("tick")
    t2.update()
    console.log(obj)
    if(t2.isAlive()) setTimeout(update,250)
}
update()
