import {Vector3,} from "./node_modules/three/build/three.module.js"

function chunkPosToVector(pos) {
    return new Vector3(pos[0],pos[1],pos[2])
}

class Chunk {
    constructor(data, pos) {
        this.data = data
        this.dims = data.dims
        this.voxels = data.voxels
        this.vmesh = null
        this.surfaceMesh = null
        this.realPosition = pos
        this.chunkPosition = [pos.x, pos.y, pos.z]
        this.id = this.chunkPosition.join('|')
    }

}

export class ChunkManager {
    constructor(opts) {
        this.listeners = {}
        this.distance = opts.chunkDistance || 2
        this.chunkSize = opts.chunkSize || 32
        this.cubeSize = opts.cubeSize || 25
        this.generateVoxelChunk = opts.generateVoxelChunk
        this.chunks = {}

        if (this.chunkSize & this.chunkSize - 1 !== 0)
            throw new Error('chunkSize must be a power of 2')

        //TODO: count the number of bits wide the chunksize is. seems like we could just use Math.log()
        //ex: if chunksize is 16 the bits is 4
        //I think bits is just used for efficient multiplication and division.
        let bits = 0
        for (let size = this.chunkSize; size > 0; size >>= 1) bits++;
        this.chunkBits = bits - 1;
    }

    on(type, cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    emit(type,evt) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(evt))
    }


    // position in chunk coords?
    nearbyChunks(position, distance) {
        const current = this.chunkAtPosition(position)
        const x = current[0]
        const y = current[1]
        const z = current[2]
        const dist = distance || this.distance
        const nearby = []
        for (let cx = (x - dist); cx !== (x + dist); ++cx) {
            for (let cy = (y - dist); cy !== (y + dist); ++cy) {
                for (let cz = (z - dist); cz !== (z + dist); ++cz) {
                    nearby.push([cx, cy, cz])
                }
            }
        }
        return nearby
    }

    //get missing chunks. position is in world coords
    requestMissingChunks(pos) {
        this.nearbyChunks(pos).map((chunk) => {
            if (!this.chunks[chunk.join('|')]) {
                this.emit('missingChunk', chunk)
            }
        })
    }

    getBounds(x, y, z) {
        const bits = this.chunkBits
        const low = [x << bits, y << bits, z << bits]
        const high = [(x + 1) << bits, (y + 1) << bits, (z + 1) << bits]
        return [low, high]
    }

    //make a chunk at the position in chunk coords
    generateChunk(pos) {
        const bounds = this.getBounds(pos.x, pos.y, pos.z)
        const chunkData = this.generateVoxelChunk(bounds[0], bounds[1], pos.x, pos.y, pos.z)
        const chunkObj = new Chunk(chunkData, pos)
        this.chunks[chunkObj.id] = chunkObj
        return chunkObj
    }

    chunkAtCoordinates(x, y, z) {
        const bits = this.chunkBits
        const cx = x >> bits
        const cy = y >> bits
        const cz = z >> bits
        return [cx, cy, cz];
    }

    //position in world coords
    chunkAtPosition(position) {
        const pt = position.divideScalar(this.cubeSize).floor()
        return this.chunkAtCoordinates(pt.x, pt.y, pt.z)
    }

    voxelIndexFromCoordinates(x, y, z) {
        const bits = this.chunkBits
        const mask = (1 << bits) - 1
        return (x & mask) + ((y & mask) << bits) + ((z & mask) << bits * 2)
    }

    voxelAtCoordinates(x, y, z, val) {
        const ckey = this.chunkAtCoordinates(x, y, z).join('|')
        const chunk = this.chunks[ckey]
        if (!chunk) return false
        const vidx = this.voxelIndexFromCoordinates(x, y, z)
        const v = chunk.voxels[vidx]
        if (typeof val !== 'undefined') {
            chunk.voxels[vidx] = val
        }
        return v
    }

    //get voxel at position in world coordinates
    voxelAtPosition(pos, val) {
        const pt = pos.divideScalar(this.cubeSize).floor()
        return this.voxelAtCoordinates(pt.x, pt.y, pt.z, val);
    }

    //report the number of chunks currently loaded into memory
    debug_getChunksLoadedCount() {
        return Object.keys(this.chunks).length
    }

    /**
     * remove chunks that are too far away
     * _pos_ is the center of the chunks to look at
     * _group_ is the ThreeJS group that the chunks are stored in
     */
    removeFarChunks(pos, group) {
        const nearbyChunks = this.nearbyChunks(pos, 2).map(chunkPos => chunkPos.join('|'))
        Object.keys(this.chunks).map((chunkIndex) => {
            //skip the nearby chunks
            if (nearbyChunks.indexOf(chunkIndex) > -1) return

            const chunk = this.chunks[chunkIndex]
            if (!chunk) return
            if (chunk.vmesh) {
                if (chunk.surfaceMesh) {
                    group.remove(chunk.surfaceMesh)
                    chunk.surfaceMesh.geometry.dispose()
                }
                delete chunk.vmesh.data
                delete chunk.vmesh.geometry
                delete chunk.vmesh.meshed
                delete chunk.vmesh.surfaceMesh
            }
            delete this.chunks[chunkIndex]
        })
    }
}

