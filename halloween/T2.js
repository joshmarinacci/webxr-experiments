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
        const res = this.fn()
        this.running = false
        return res
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
}



const t2 = new T2()

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
