import {Raycaster, Vector2} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {TERRAINS} from './globals.js'
import {HexMapView, makeTree, Highlighted} from './hexsystem.js'

export class MouseInputSystem extends System {

    init() {
        this.raycaster = new Raycaster()
        this.mouse = new Vector2()
        this.current = null
    }
    execute() {
        if(!this.doneSetup) {
            this.setupListeners(this.queries.three.results[0].getMutableComponent(ThreeCore))
            this.doneSetup = true
        }
    }

    findHexAtMouseEvent(e) {
        this.mouse = new Vector2()
        const bounds = e.target.getBoundingClientRect()
        this.mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        this.mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1

        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        this.raycaster.setFromCamera(this.mouse, core.camera)
        const intersects = this.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(it.object.userData.hex) {
                return {hex:it.object.userData.hex, node:it.object}
            }
        }

        return {}
    }

    setupListeners(core) {
        core.getCanvas().addEventListener('mousemove',(e)=>{
            const {hex,node} = this.findHexAtMouseEvent(e)
            if(hex) {
                const mapView = this.queries.map.results[0].getMutableComponent(HexMapView)
                const data = mapView.map.get(hex)
                const ent = data.ent

                if(this.current && this.current.hasComponent(Highlighted) && this.current !== ent) {
                    this.current.removeComponent(Highlighted)
                }
                if(!ent.hasComponent(Highlighted)) {
                    ent.addComponent(Highlighted)
                    this.current = ent
                }
            }
        })
        core.getCanvas().addEventListener('mousedown',(e)=>{
            const {hex,node} = this.findHexAtMouseEvent(e)
            if(!hex) return
            const mapView = this.queries.map.results[0].getMutableComponent(HexMapView)
            const data = mapView.map.get(hex)
            if(data.terrain === TERRAINS.GRASS && data.tree === false) {
                data.tree = true
                data.treeNode = makeTree(hex,data,2)
                mapView.threeNode.add(data.treeNode)
                return
            }
            if(data.terrain === TERRAINS.GRASS && data.tree === true) {
                const tree = data.treeNode
                data.tree = false
                data.treeNode = null
                data.treeLevel = 0
                mapView.threeNode.remove(tree)
            }
        })
    }
}
MouseInputSystem.queries = {
    three: {
        components:[ThreeCore]
    },
    map: {
        components: [HexMapView]
    }
}
