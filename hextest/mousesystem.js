import {Vector2, Raycaster} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {terrainToColor, TERRAINS} from './globals.js'
import {pixel_to_pointy_hex, Point} from './hex.js'
import {HexMapView, makeTree} from './hexsystem.js'
import {pointy_hex_to_pixel} from './hex'
import {terrainToHeight} from './globals'

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
                if(this.current) {
                    this.current.material.color.set(this.current.userData.regularColor)
                }
                this.current = node
                node.material.color.set('red')
            }
        })
        core.getCanvas().addEventListener('mousedown',(e)=>{
            const {hex,node} = this.findHexAtMouseEvent(e)
            if(!hex) return
            const mapView = this.queries.map.results[0].getMutableComponent(HexMapView)
            const data = mapView.map.get(hex)
            if(data.terrain === TERRAINS.GRASS && data.tree === false) {
                const tree = makeTree()
                const center = pointy_hex_to_pixel(hex,mapView.size)
                const h = terrainToHeight(data.terrain)
                tree.position.x = center.x*1.05
                tree.position.z = center.y*1.05
                tree.position.y = h/2 + 2
                data.treeNode = tree
                data.tree = true
                mapView.threeNode.add(tree)
                return
            }
            if(data.terrain === TERRAINS.GRASS && data.tree === true) {
                const tree = data.treeNode
                data.tree = false
                data.treeNode = null
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
