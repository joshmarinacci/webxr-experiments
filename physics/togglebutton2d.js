import Button2D from './button2d'

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
            } else {
                this.normalBg = 'white'
            }
            this.fire('selected',this)
        }
        return this
    }
}
