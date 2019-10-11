import {Vector2, Raycaster,
    BufferGeometry,
    Float32BufferAttribute,
    LineBasicMaterial,
    AdditiveBlending,
    Line,
    Vector3,

} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {terrainToColor, TERRAINS} from './globals.js'
import {pixel_to_pointy_hex, Point} from './hex.js'
import {HexMapView, makeTree} from './hexsystem.js'
import {pointy_hex_to_pixel} from './hex'
import {terrainToHeight} from './globals'
import {MouseInputSystem} from './mousesystem'

export class VRInputSystem extends System {
    init() {
        console.log('starting the VR input system')
        this.raycaster = new Raycaster()
    }
    execute() {
        if(!this.started) {
            this.started = true
            this.queries.three.results.forEach(ent => {
                const core = ent.getMutableComponent(ThreeCore)
                const controller1 = core.renderer.vr.getController(0)
                controller1.addEventListener('selectstart',()=>{
                    console.log('start')
                })
                controller1.addEventListener('selectend',()=>{
                    console.log("stop")
                })
                core.scene.add(controller1)

                const controller2 = core.renderer.vr.getController(0)
                controller2.addEventListener('selectstart',()=>{
                    console.log('start')
                })
                controller2.addEventListener('selectend',()=>{
                    console.log("stop")
                })
                core.scene.add(controller2)

                const geometry = new BufferGeometry()
                geometry.addAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 4 ], 3 ) );
                geometry.addAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
                const material = new LineBasicMaterial( { vertexColors: true, blending: AdditiveBlending } );
                controller2.add( new Line( geometry, material ) );
                controller2.add( new Line( geometry, material ) );
                this.controller1 = controller1
            })
        }
        this.queries.three.results.forEach(ent => {
            this.updatePointing(ent.getMutableComponent(ThreeCore))
        })
    }

    findHexAtController(core,controller) {
        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(this.controller1.quaternion)
        this.raycaster.set(this.controller1.position, dir)
        const intersects = this.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(it.object.userData.hex) {
                return {hex:it.object.userData.hex, node:it.object}
            }
        }
        return {}
    }

    updatePointing(core) {
        const {hex,node} = this.findHexAtController(core,this.controller1)
        if(hex) {
            if(this.current) {
                this.current.material.color.set(this.current.userData.regularColor)
            }
            this.current = node
            node.material.color.set('red')
        }
    }
}

VRInputSystem.queries = {
    three: {
        components: [ThreeCore]
    },
    map: {
        components: [HexMapView]
    }
}
