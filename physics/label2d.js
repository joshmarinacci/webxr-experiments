export default class Label2D {
    constructor() {
        this.text = 'foo'
        this.fsize = 30
        this.x = 0
        this.y = 0
    }
    draw(ctx) {
        ctx.font = `${this.fsize}px sans-serif`
        ctx.fillStyle = 'black'
        ctx.fillText(this.text,this.x+3,this.y+this.fsize)
    }
    contains() {
        return false
    }
    set(key,value) {
        this[key] = value
        return this
    }
}
