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
        var current = this.chunkAtPosition(position)
        var x = current[0]
        var y = current[1]
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
        var self = this
        const position = [p.x,p.y,p.z]
        this.nearbyChunks(position).map(function (chunk) {
            if (!self.chunks[chunk.join('|')]) {
                self.emit('missingChunk', chunk)
            }
        })
    }

    getBounds(x, y, z) {
        var bits = this.chunkBits
        var low = [x << bits, y << bits, z << bits]
        var high = [(x + 1) << bits, (y + 1) << bits, (z + 1) << bits]
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
        var bits = this.chunkBits;
        var cx = x >> bits;
        var cy = y >> bits;
        var cz = z >> bits;
        var chunkPos = [cx, cy, cz];
        return chunkPos;
    }

     //position in chunk coords or voxel coords?
     chunkAtPosition(position) {
        var cubeSize = this.cubeSize;
        var x = Math.floor(position[0] / cubeSize)
        var y = Math.floor(position[1] / cubeSize)
        var z = Math.floor(position[2] / cubeSize)
        var chunkPos = this.chunkAtCoordinates(x, y, z)
        return chunkPos
    };

    voxelIndexFromCoordinates(x, y, z) {
        var bits = this.chunkBits
        var mask = (1 << bits) - 1
        var vidx = (x & mask) + ((y & mask) << bits) + ((z & mask) << bits * 2)
        return vidx
    }

    voxelIndexFromPosition(pos) {
        var v = this.voxelVector(pos)
        return this.voxelIndex(v)
    }

    voxelAtCoordinates(x, y, z, val) {
        var ckey = this.chunkAtCoordinates(x, y, z).join('|')
        var chunk = this.chunks[ckey]
        if (!chunk) return false
        var vidx = this.voxelIndexFromCoordinates(x, y, z)
        var v = chunk.voxels[vidx]
        if (typeof val !== 'undefined') {
            chunk.voxels[vidx] = val
        }
        return v
    }

    voxelAtPosition(pos, val) {
        var cubeSize = this.cubeSize;
        var x = Math.floor(pos[0] / cubeSize)
        var y = Math.floor(pos[1] / cubeSize)
        var z = Math.floor(pos[2] / cubeSize)
        // console.log("x=",x,y,z)
        var v = this.voxelAtCoordinates(x, y, z, val)
        return v;
    }

// deprecated
    voxelIndex(voxelVector) {
        var vidx = this.voxelIndexFromCoordinates(voxelVector[0], voxelVector[1], voxelVector[2])
        return vidx
    }

// deprecated
    voxelVector(pos) {
        var cubeSize = this.cubeSize
        var mask = (1 << this.chunkBits) - 1
        var vx = (Math.floor(pos[0] / cubeSize)) & mask
        var vy = (Math.floor(pos[1] / cubeSize)) & mask
        var vz = (Math.floor(pos[2] / cubeSize)) & mask
        return [vx, vy, vz]
    }

    debug_getChunksLoadedCount() {
        return Object.keys(this.chunks).length
    }
}

