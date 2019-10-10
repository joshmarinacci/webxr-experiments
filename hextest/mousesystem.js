import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem'

export class MouseInputSystem extends System {

    init() {
        console.log("doing init")
        console.log('attaching mouse listeners')
        this.prevButton
        document.addEventListener('mousemove',(e)=>{
            console.log("mouse moved",e.buttons,e.clientX, e.clientY)
            this.prevButton = e.buttons
        })
    }
    execute() {
        if(this.prevButton === 1) {
            this.queries.three.results.forEach(ent => {
                const core = ent.getMutableComponent(ThreeCore)
                // core.camera.rotation.y += 0.001
            })
        }
    }

    initialize() {
    }
}
MouseInputSystem.queries = {
    three: {
        components:[ThreeCore]
    }
}
