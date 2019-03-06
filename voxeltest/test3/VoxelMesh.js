import {
    Color,
    Face3,
    FaceColors,
    Geometry,
    Mesh,
    MeshLambertMaterial,
    Vector2,
    Vector3,
} from "./node_modules/three/build/three.module.js"

export class VoxelMesh {
    constructor(data, mesher, scaleFactor) {
        this.data = data
        const geometry = this.geometry = new Geometry()
        this.scale = scaleFactor || new Vector3(10, 10, 10)

        const result = mesher.mesh(data.voxels, data.dims)
        this.meshed = result

        geometry.vertices.length = 0
        geometry.faces.length = 0

        for (let i = 0; i < result.vertices.length; ++i) {
            let q = result.vertices[i]
            geometry.vertices.push(new Vector3(q[0], q[1], q[2]))
        }

        for (let i = 0; i < result.faces.length; ++i) {
            const uv = this.faceVertexUv(i)

            let q = result.faces[i]
            if (q.length === 5) {
                geometry.faceVertexUvs[0].push([uv[1], uv[0], uv[2]])
                const f = new Face3(q[0], q[1], q[2])
                //I think the point of this is to start block types as colors. there's probably a better way to do this
                //with buffer attributes
                f.color = new Color(q[4])
                geometry.faces.push(f)

                geometry.faceVertexUvs[0].push([uv[2], uv[0], uv[1]])
                const f2 = new Face3(q[0], q[2], q[3])
                f2.color = new Color(q[4])
                geometry.faces.push(f2)
            }
        }

        geometry.computeFaceNormals()
        geometry.uvsNeedUpdate = true
        geometry.verticesNeedUpdate = true
        geometry.elementsNeedUpdate = true
        geometry.normalsNeedUpdate = true

        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()

    }

    createSurfaceMesh(material) {
        material = material || new MeshLambertMaterial({color: 'white', vertexColors: FaceColors})
        const surfaceMesh = new Mesh(this.geometry, material)
        surfaceMesh.scale.copy(this.scale)
        this.surfaceMesh = surfaceMesh
        return surfaceMesh
    }

    faceVertexUv(i) {
        let height
        let width
        const vs = [
            this.meshed.vertices[i * 4 + 0],
            this.meshed.vertices[i * 4 + 1],
            this.meshed.vertices[i * 4 + 2],
            this.meshed.vertices[i * 4 + 3]
        ]
        const spans = {
            x0: vs[0][0] - vs[1][0],
            x1: vs[1][0] - vs[2][0],
            y0: vs[0][1] - vs[1][1],
            y1: vs[1][1] - vs[2][1],
            z0: vs[0][2] - vs[1][2],
            z1: vs[1][2] - vs[2][2]
        }
        const size = {
            x: Math.max(Math.abs(spans.x0), Math.abs(spans.x1)),
            y: Math.max(Math.abs(spans.y0), Math.abs(spans.y1)),
            z: Math.max(Math.abs(spans.z0), Math.abs(spans.z1))
        }
        if (size.x === 0) {
            if (spans.y0 > spans.y1) {
                width = size.y
                height = size.z
            } else {
                width = size.z
                height = size.y
            }
        }
        if (size.y === 0) {
            if (spans.x0 > spans.x1) {
                width = size.x
                height = size.z
            } else {
                width = size.z
                height = size.x
            }
        }
        if (size.z === 0) {
            if (spans.x0 > spans.x1) {
                width = size.x
                height = size.y
            } else {
                width = size.y
                height = size.x
            }
        }
        if ((size.z === 0 && spans.x0 < spans.x1) || (size.x === 0 && spans.y0 > spans.y1)) {
            return [
                new Vector2(height, 0),
                new Vector2(0, 0),
                new Vector2(0, width),
                new Vector2(height, width)
            ]
        } else {
            return [
                new Vector2(0, 0),
                new Vector2(0, height),
                new Vector2(width, height),
                new Vector2(width, 0)
            ]
        }
    }
}
