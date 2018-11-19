export default class Label2D {
    constructor() {
        this.type = 'label'
        this.text = 'foo'
        this.fsize = 30
        this.listeners = {}
        this.x = 0
        this.y = 0
        this.w = this.text.length*this.fsize
        this.h = 20
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    draw(ctx) {
        const metrics = ctx.measureText(this.text)
        this.w = 5 + metrics.width + 5
        this.h = 2 + this.fsize + 2
        ctx.font = `${this.fsize}px sans-serif`
        ctx.fillStyle = 'black'
        ctx.fillText(this.text,this.x+3,this.y+this.fsize)
    }
    contains() {
        return false
    }
    findAt() {
        return null
    }
    set(key,value) {
        this[key] = value
        return this
    }
}
