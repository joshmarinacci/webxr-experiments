import Group2D from './group2d.js'
import Button2D from './button2d.js'
const rowLayout = (panel)=>{
    let x = 0
    panel.comps.forEach((c)=>{
        c.x=x
        c.y=0
        x += c.w+panel.padding
    })
}

export default class ToggleGroup extends Group2D {
    constructor(values) {
        super()
        this.value = null
        this.set('layout',rowLayout)
        Object.keys(values).forEach(key =>{
            this.add(new Button2D().set('text',key).on('click',(sel)=> this.set('value',key)))
        })
    }
    set(key,value) {
        super.set(key,value)
        if(key === 'value') {
            this.comps.forEach(comp => {
                const selected = (comp.get('text') === value)
                comp.normalBg = selected?'aqua':'white'
                comp.bg = comp.normalBg
            })
            this.fire('selected',this)
        }
        return this
    }
}
