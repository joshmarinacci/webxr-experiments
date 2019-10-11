import {
    AdditiveBlending,
    BufferGeometry,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    Raycaster,
    Vector3
} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {HexMapView} from './hexsystem.js'
import {TERRAINS} from './globals'
import {makeTree} from './hexsystem'

class VRController {
    constructor() {
        this.vrid = -1
        this.prevPressed = false
        this.pressed = false
    }
}

export class VRInputSystem extends System {
    init() {
        this.raycaster = new Raycaster()
    }
    execute() {
        if(!this.started) {
            this.started = true
            this.world.createEntity().addComponent(VRController,{vrid:0})
            this.world.createEntity().addComponent(VRController,{vrid:1})
        }

        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        this.queries.controllers.added.forEach(ent => {
            const con = ent.getMutableComponent(VRController)
            con.controller = core.renderer.vr.getController(con.vrid)
            con.controller.addEventListener('selectstart', () => {
                con.pressed = true
            })
            con.controller.addEventListener('selectend', () => {
                con.pressed = false
            })
            core.scene.add(con.controller)

            const geometry = new BufferGeometry()
            geometry.addAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0,  0, 0,-4], 3 ) );
            geometry.addAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
            const material = new LineBasicMaterial( { vertexColors: true, blending: AdditiveBlending } );
            con.controller.add( new Line( geometry, material ) );
        })
        this.queries.controllers.results.forEach(ent => {
            const cont = ent.getMutableComponent(VRController)
            this.updatePointing(core,cont)
            this.updateClick(core,cont)
        })
    }

    findHexAtController(core,controller) {
        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(controller.quaternion)
        this.raycaster.set(controller.position, dir)
        const intersects = this.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(it.object.userData.hex) {
                return {hex:it.object.userData.hex, node:it.object}
            }
        }
        return {}
    }

    updatePointing(core,controller) {
        const {hex,node} = this.findHexAtController(core,controller.controller)
        if(hex) {
            if(this.current) {
                this.current.material.color.set(this.current.userData.regularColor)
            }
            this.current = node
            node.material.color.set('red')
        }
    }

    updateClick(core, cont) {
        if(cont.prevPressed === false && cont.pressed === true) {
            cont.prevPressed = cont.pressed
            const {hex,node} = this.findHexAtController(core,cont.controller)
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
                return
            }
        }
        cont.prevPressed = cont.pressed
    }
}

VRInputSystem.queries = {
    three: {
        components: [ThreeCore]
    },
    controllers: {
        components:[VRController],
        listen: {
            added:true,
            removed:true,
        }
    },
    map: {
        components: [HexMapView]
    }
}
