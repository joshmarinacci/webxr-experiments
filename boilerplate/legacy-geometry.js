import {Face3} from './node_modules/three/build/three.module.js'
import {Geometry} from './node_modules/three/examples/jsm/deprecated/Geometry.js'

const THREE = globalThis.THREE

if (!THREE) throw new Error('Load Three.js before the legacy geometry adapter')

THREE.Geometry = Geometry
THREE.Face3 = Face3

Geometry.prototype.applyMatrix = Geometry.prototype.applyMatrix4

const mergeGeometry = Geometry.prototype.merge
Geometry.prototype.merge = function (geometry, matrix, materialIndexOffset) {
    if (geometry && geometry.isBufferGeometry) {
        geometry = new Geometry().fromBufferGeometry(geometry)
    }
    return mergeGeometry.call(this, geometry, matrix, materialIndexOffset)
}

for (const name of [
    'BoxGeometry',
    'CircleGeometry',
    'ConeGeometry',
    'CylinderGeometry',
    'DodecahedronGeometry',
    'IcosahedronGeometry',
    'LatheGeometry',
    'PlaneGeometry',
    'SphereGeometry'
]) {
    const BufferGeometryConstructor = THREE[name]
    if (typeof BufferGeometryConstructor !== 'function') continue

    THREE[name] = function (...args) {
        return new Geometry().fromBufferGeometry(new BufferGeometryConstructor(...args))
    }
}

for (const name of ['Mesh', 'Line', 'LineSegments', 'Points']) {
    const ObjectConstructor = THREE[name]
    if (typeof ObjectConstructor !== 'function') continue

    THREE[name] = function (geometry, ...args) {
        if (geometry && geometry.isGeometry) {
            const legacyGeometry = geometry
            geometry = legacyGeometry.toBufferGeometry()
            // A few experiments inspect the old arrays after constructing a mesh.
            geometry.vertices = legacyGeometry.vertices
            geometry.faces = legacyGeometry.faces
        }
        return new ObjectConstructor(geometry, ...args)
    }
    THREE[name].prototype = ObjectConstructor.prototype
}
