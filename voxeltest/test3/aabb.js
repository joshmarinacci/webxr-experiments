import {Vector3} from "./node_modules/three/build/three.module.js"

// var vec3 = require('gl-matrix').vec3

export function AABB(pos, vec) {

    if(!(this instanceof AABB)) {
        return new AABB(pos, vec)
    }

    var pos2 = new Vector3()
    pos2.copy(pos)
    pos2.add(vec)
    // vec3.add(pos2, pos, vec)
    // this.base = vec3.min(vec3.create(), pos, pos2)
    this.base = new Vector3()
    this.base.copy(pos)
    this.base.min(pos2)
    this.vec = vec
    // this.max = vec3.max(vec3.create(), pos, pos2)
    this.max = new Vector3()
    this.max.copy(pos)
    this.max.max(pos2)

    // this.mag = vec3.length(this.vec)
    this.mag = this.vec.length()

}

var cons = AABB
    , proto = cons.prototype

proto.width = function() {
    return this.vec.x
}

proto.height = function() {
    return this.vec.y
}

proto.depth = function() {
    return this.vec.z
}

proto.x0 = function() {
    return this.base.x
}

proto.y0 = function() {
    return this.base.y
}

proto.z0 = function() {
    return this.base.z
}

proto.x1 = function() {
    return this.max.x
}

proto.y1 = function() {
    return this.max.y
}

proto.z1 = function() {
    return this.max.z
}

proto.translate = function(by) {
    this.max.add(by)
    this.base.add(by)
    // vec3.add(this.max, this.max, by)
    // vec3.add(this.base, this.base, by)
    return this
}

proto.expand = function(aabb) {
    var max = new Vector3()
    var min = new Vector3()
    // var max = vec3.create()
    //     , min = vec3.create()

    // vec3.max(max, aabb.max, this.max)
    max.copy(aabb.max).max(this.max)
    // vec3.min(min, aabb.base, this.base)
    min.copy(aabb.base).min(this.base)
    max.sub(min)
    // vec3.sub(max, max, min)
    return new AABB(min, max)
}

proto.intersects = function(aabb) {
    if(aabb.base.x > this.max.x) return false
    if(aabb.base.y > this.max.y) return false
    if(aabb.base.z > this.max.z) return false
    if(aabb.max.x < this.base.x) return false
    if(aabb.max.y < this.base.y) return false
    if(aabb.max.z < this.base.z) return false

    return true
}

proto.touches = function(aabb) {
    var intersection = this.union(aabb);
    return (intersection !== null) &&
        ((intersection.width() == 0) ||
            (intersection.height() == 0) ||
            (intersection.depth() == 0))

}

proto.union = function(aabb) {
    if(!this.intersects(aabb)) return null

    var base_x = Math.max(aabb.base.x, this.base.x)
        , base_y = Math.max(aabb.base.y, this.base.y)
        , base_z = Math.max(aabb.base.z, this.base.z)
        , max_x = Math.min(aabb.max.x, this.max.x)
        , max_y = Math.min(aabb.max.y, this.max.y)
        , max_z = Math.min(aabb.max.z, this.max.z)

    return new AABB(new Vector3(base_x, base_y, base_z), new Vector3(max_x - base_x, max_y - base_y, max_z - base_z))
}




