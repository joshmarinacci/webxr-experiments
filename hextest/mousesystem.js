import {Vector2, Raycaster} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {pixel_to_pointy_hex, Point} from './hex.js'

export class MouseInputSystem extends System {

    init() {
        this.raycaster = new Raycaster()
        this.mouse = new Vector2()
        document.addEventListener('mousemove',(e)=>{
            // console.log("mouse moved",e.buttons,e.clientX, e.clientY,e.target)
            this.mouse = new Vector2()
            const bounds = e.target.getBoundingClientRect()
            this.mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
            this.mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        })
        this.current = null
    }
    execute() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            this.raycaster.setFromCamera(this.mouse, core.camera)
            const intersects = this.raycaster.intersectObjects(core.scene.children,true)
            for(let i=0; i<intersects.length; i++) {
                const it = intersects[i]
                if(it.object.userData.hex) {
                    if(this.current) {
                        this.current.material.color.set(this.current.userData.regularColor)
                    }
                    this.current = it.object
                    it.object.material.color.set('red')
                }
            }
        })
    }

    initialize() {
    }
}
MouseInputSystem.queries = {
    three: {
        components:[ThreeCore]
    }
}
