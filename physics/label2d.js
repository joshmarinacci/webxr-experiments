export default class Label2D {
    constructor() {
        this.type = 'label'
        this.text = 'foo'
        this.fsize = 30
        this.listeners = {}
        this.x = 0
        this.y = 0
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    draw(ctx) {
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
