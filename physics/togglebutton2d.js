import Button2D from './button2d.js'

export default class ToggleButton2D extends Button2D {


    constructor() {
        super()
        this.selected = false

        this.on('click',()=>{
            this.set('selected',!this.get('selected'))
        })
    }

    set(key,value) {
        super.set(key,value)
        if(key === 'selected') {
            if(this.selected) {
                this.normalBg = 'aqua'
                this.bg = this.normalBg
            } else {
                this.normalBg = 'white'
                this.bg = this.normalBg
            }
            this.fire('selected',this)
        }
        return this
    }
}
