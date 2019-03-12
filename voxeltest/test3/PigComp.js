import {Vector3, Mesh, MeshLambertMaterial, BoxBufferGeometry} from "./node_modules/three/build/three.module.js"
import {ECSComp} from "./ECSComp.js"
import {traceRay} from './raycast.js'

export class PigComp extends ECSComp {
    constructor(chunkManager) {
        super()

        this.chunkManager = chunkManager
        this.mesh = new Mesh(
            new BoxBufferGeometry(1,1,1),
            new MeshLambertMaterial({color:'pink'})
        )

        this.heading = new Vector3(-1,0,0).normalize()
        this.mesh.position.set(0,-1.5,-10)
        this.velocity = 0.05
    }

    update(time) {
        const move = this.heading.clone()
        move.multiplyScalar(this.velocity)
        const newPos = this.mesh.position.clone()
        newPos.add(move)
        this.mesh.position.copy(newPos)
        const epilson = 1e-8
        const hitNormal = new Vector3(0,0,0)
        const hitPosition = new Vector3(0,0,0)
        const hitBlock = traceRay(this.chunkManager,newPos,this.heading,1,hitPosition,hitNormal,epilson)
        if(hitBlock > 0) {
            // console.log("hit", hitBlock, hitPosition, hitNormal)
            this.heading.x = Math.random()-0.5
            this.heading.z = Math.random()-0.5
            this.heading.normalize()
        }
    }

}
