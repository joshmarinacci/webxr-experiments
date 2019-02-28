// const events = require('events')

export class Chunker  {
    constructor(opts) {
        // super()
        this.distance = opts.chunkDistance || 2
        this.chunkSize = opts.chunkSize || 32
        this.chunkPad = opts.chunkPad !== undefined ? opts.chunkPad : 0
        this.cubeSize = opts.cubeSize || 25
        this.generateVoxelChunk = opts.generateVoxelChunk
        this.chunks = {}
        this.meshes = {}

        if (this.chunkSize & this.chunkSize - 1 !== 0)
            throw new Error('chunkSize must be a power of 2')
        let bits = 0
        for (let size = this.chunkSize; size > 0; size >>= 1) bits++
        this.chunkBits = bits - 1
        this.chunkMask = (1 << this.chunkBits) - 1
        this.chunkPadHalf = this.chunkPad >> 1
    }


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

    requestMissingChunks(position) {
        const self = this
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

    generateChunk(x, y, z) {
        const bounds = this.getBounds(x, y, z)
        const chunk = this.generateVoxelChunk(bounds[0], bounds[1], x, y, z)
        const position = [x, y, z]
        chunk.position = position
        this.chunks[position.join('|')] = chunk
        return chunk
    }

    chunkAtCoordinates(x, y, z) {
        const bits = this.chunkBits
        const cx = x >> bits
        const cy = y >> bits
        const cz = z >> bits
        const chunkPos = [cx, cy, cz]
        return chunkPos
    }

    chunkAtPosition(position) {
        const cubeSize = this.cubeSize
        const x = Math.floor(position[0] / cubeSize)
        const y = Math.floor(position[1] / cubeSize)
        const z = Math.floor(position[2] / cubeSize)
        const chunkPos = this.chunkAtCoordinates(x, y, z)
        return chunkPos
    };

    voxelIndexFromCoordinates(x, y, z) {
        throw new Error('Chunker.prototype.voxelIndexFromCoordinates removed, use voxelAtCoordinates')
    }

    voxelAtCoordinates(x, y, z, val) {
        const ckey = this.chunkAtCoordinates(x, y, z).join('|')
        const chunk = this.chunks[ckey]
        if (!chunk) return false
        const mask = this.chunkMask
        const h = this.chunkPadHalf
        const mx = x & mask
        const my = y & mask
        const mz = z & mask
        const v = chunk.get(mx + h, my + h, mz + h)
        if (typeof val !== 'undefined') {
            chunk.set(mx + h, my + h, mz + h, val)
        }
        return v
    }

    voxelAtPosition(pos, val) {
        const cubeSize = this.cubeSize
        const x = Math.floor(pos[0] / cubeSize)
        const y = Math.floor(pos[1] / cubeSize)
        const z = Math.floor(pos[2] / cubeSize)
        const v = this.voxelAtCoordinates(x, y, z, val)
        return v
    }

}
