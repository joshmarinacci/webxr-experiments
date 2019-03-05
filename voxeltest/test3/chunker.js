export class Chunker {
    constructor(opts) {
        this.listeners = {}
        this.distance = opts.chunkDistance || 2
        this.chunkSize = opts.chunkSize || 32
        this.cubeSize = opts.cubeSize || 25
        this.generateVoxelChunk = opts.generateVoxelChunk
        this.chunks = {}
        this.meshes = {}

        if (this.chunkSize & this.chunkSize - 1 !== 0)
            throw new Error('chunkSize must be a power of 2')
        var bits = 0;
        for (var size = this.chunkSize; size > 0; size >>= 1) bits++;
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
        var z = current[2]
        var dist = distance || this.distance
        var nearby = []
        for (var cx = (x - dist); cx !== (x + dist); ++cx) {
            for (var cy = (y - dist); cy !== (y + dist); ++cy) {
                for (var cz = (z - dist); cz !== (z + dist); ++cz) {
                    nearby.push([cx, cy, cz])
                }
            }
        }
        return nearby
    }

    requestMissingChunks(p) {
        const self = this
        const position = [p.x,p.y,p.z]
        this.nearbyChunks(position).map(function (chunk) {
            if (!self.chunks[chunk.join('|')]) {
                self.emit('missingChunk', chunk)
            }
        })
    }

    getBounds(x, y, z) {
        const bits = this.chunkBits
        const low = [x << bits, y << bits, z << bits]
        const high = [(x + 1) << bits, (y + 1) << bits, (z + 1) << bits]
        return [low, high]
    }

    generateChunk(pos) {
        const bounds = this.getBounds(pos.x, pos.y, pos.z)
        const chunk = this.generateVoxelChunk(bounds[0], bounds[1], pos.x, pos.y, pos.z)
        const position = [pos.x, pos.y, pos.z]
        chunk.position = position
        this.chunks[position.join('|')] = chunk
        return chunk
    }

    chunkAtCoordinates(x, y, z) {
        const bits = this.chunkBits
        const cx = x >> bits
        const cy = y >> bits
        const cz = z >> bits
        return [cx, cy, cz];
    }

    //position in chunk coords or voxel coords?
    chunkAtPosition(position) {
        const cubeSize = this.cubeSize
        const x = Math.floor(position[0] / cubeSize)
        const y = Math.floor(position[1] / cubeSize)
        const z = Math.floor(position[2] / cubeSize)
        return this.chunkAtCoordinates(x, y, z)
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

    voxelAtPosition(pos, val) {
        const cubeSize = this.cubeSize
        const x = Math.floor(pos[0] / cubeSize)
        const y = Math.floor(pos[1] / cubeSize)
        const z = Math.floor(pos[2] / cubeSize)
        return this.voxelAtCoordinates(x, y, z, val);
    }

    debug_getChunksLoadedCount() {
        return Object.keys(this.chunks).length
    }
}

