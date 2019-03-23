import {Vector3,} from "./node_modules/three/build/three.module.js"
import {ECSComp} from './ECSComp'

export class ItemManager extends ECSComp {
    constructor(app) {
        super()
        this.app = app
    }

    isBlockTypeItem(type) {
        if(type === 5) return true
        return false
    }

    removeItem(pos) {
        const type = this.app.chunkManager.voxelAtCoordinates(pos)
        const radius = 2;
        if(type === 5) {
            console.log("triggering TNT explosion")
            const cursor = new Vector3()
            for(let x=pos.x-radius; x<=pos.x+radius; x++) {
                cursor.x = x
                for(let y=pos.y-radius; y<=pos.y+radius; y++) {
                    cursor.y = y
                    for(let z = pos.z-radius; z<=pos.z+radius; z++) {
                        cursor.z = z
                        this.app.chunkManager.setVoxelAtCoordinates(cursor, 0)
                    }
                }
            }
            const chunkIndex = this.app.chunkManager.chunkIndexAtCoordinates(pos.x,pos.y,pos.z)
            const chunk = this.app.chunkManager.chunks[chunkIndex.join("|")]
            if(chunk) this.app.rebuildMesh(chunk)
        }
    }
}
