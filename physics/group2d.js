
import {POINTER_CLICK, POINTER_ENTER, POINTER_EXIT, POINTER_PRESS, POINTER_MOVE, Pointer} from '../boilerplate/pointer.js'

export default class Group2D {
    constructor() {
        this.x = 0
        this.y = 0
        this.w = 100
        this.h = 100
        this.listeners = {}
        this.bg = 'white'
        this.visible = true
        this.comps = []
        this.redrawHandler = (e) => this.fire('changed',e)
        this.childProps = {}
        this.padding = 5
        this.border = 1

        this.layout = (comp) => {
            console.log("not laying out anything")
        }
    }
    draw(ctx) {
        if(!this.visible) return
        this.layout(this)
        ctx.fillStyle = this.bg
        ctx.fillRect(this.x,this.y,this.w,this.h)
        if(this.border > 0) {
            ctx.strokeStyle = 'black'
            ctx.strokeRect(this.x, this.y, this.w, this.h)
        }
        ctx.save()
        ctx.translate(this.x+this.padding,this.y+this.padding)
        this.comps.forEach(comp => comp.draw(ctx))
        ctx.restore()
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
        return this
    }
    contains(pt) {
        if(pt.x < this.x) return false
        if(pt.x > this.x + this.w) return false
        if(pt.y < this.y) return false
        if(pt.y > this.y + this.h) return false
        return true
    }
    findAt(pt) {
        if(!this.visible) return null
        for(let i=0; i<this.comps.length; i++) {
            const comp = this.comps[i]
            const res = comp.findAt({x:pt.x-comp.x-5,y:pt.y-comp.y-5})
            if(res) return res
        }
        return null
    }
    fire(type,e) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(e))
    }
    set(key,value) {
        this[key] = value
        this.fire('changed',{type:'changed',target:this})
        return this
    }
    childSet(key,value) {
        this.childProps[key] = value
        this.comps.forEach(ch=>ch.set(key,value))
        return this
    }
    get(key) {
        return this[key]
    }

    on(type,cb) {
        this.addEventListener(type,cb)
        return this
    }

    add(comp) {
        this.comps.push(comp)
        comp.addEventListener('changed',this.redrawHandler)
        Object.keys(this.childProps).forEach(key => {
            comp.set(key,this.childProps[key])
        })
    }
    addAll(all) {
        all.forEach(c => this.add(c))
    }
}
