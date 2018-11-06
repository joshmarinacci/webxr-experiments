import {POINTER_CLICK, POINTER_ENTER, POINTER_EXIT, POINTER_PRESS, POINTER_MOVE, Pointer} from '../boilerplate/pointer.js'

export default class Button2D {
    constructor() {
        this.text = 'foo'
        this.x = 0
        this.y = 0
        this.fsize = 20
        this.w = this.text.length*this.fsize
        this.h = 20
        this.listeners = {}
        this.bg = 'white'

        this.on(POINTER_ENTER,()=>{
            this.bg = 'red'
            this.fire('changed',{type:'changed',target:this})
        })
        this.on(POINTER_EXIT,()=>{
            this.bg = 'white'
            this.fire('changed',{type:'changed',target:this})
        })
    }
    draw(ctx) {
        this.w = this.text.length * this.fsize

        ctx.fillStyle = this.bg
        ctx.fillRect(this.x,this.y,this.w,this.h)
        ctx.fillStyle = 'black'
        ctx.fillText(this.text,this.x+3,this.y+10)
        ctx.strokeStyle = 'black'
        ctx.strokeRect(this.x,this.y,this.w,this.h)
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    contains(pt) {
        if(pt.x < this.x) return false
        if(pt.x > this.x + this.w) return false
        if(pt.y < this.y) return false
        if(pt.y > this.y + this.h) return false
        return true
    }
    fire(type) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb())
    }
    set(key,value) {
        this[key] = value
        return this
    }
    on(type,cb) {
        this.addEventListener(type,cb)
        return this
    }
}
