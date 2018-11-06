export default class Label2D {
    constructor() {
        this.text = 'foo'
        this.x = 0
        this.y = 0
    }
    draw(ctx) {
        ctx.fillStyle = 'black'
        ctx.fillText(this.text,this.x,this.y+10)
    }
    contains() {
        return false
    }
    set(key,value) {
        this[key] = value
        return this
    }
}
