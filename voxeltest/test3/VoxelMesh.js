import {
    Color,
    Face3,
    FaceColors,
    Geometry,
    BufferGeometry,
    Mesh,
    MeshLambertMaterial,
    Vector2,
    Vector3,
    MeshNormalMaterial,
    Float32BufferAttribute,
    BufferAttribute,
} from "./node_modules/three/build/three.module.js"

export class VoxelMesh {
    constructor(data, mesher, scaleFactor, app) {
        this.data = data
        const geometry = this.geometry = new BufferGeometry()
        this.scale = scaleFactor || new Vector3(10, 10, 10)

        const result = mesher.mesh(data.voxels, data.dims)
        this.meshed = result

        //create empty geometry
        const vertices = []
        const repeatCount = []

        //copy all verticies in from meshed data
        for (let i = 0; i < result.vertices.length; ++i) {
            let q = result.vertices[i]
            vertices.push(q[0],q[1],q[2])
            repeatCount.push(1)
        }

        const indices = []
        const guvs = []
        if(result.faces.length > 0) console.log(result)
        /*
            generate faces from meshed data

            Note: that quad faces do not use shared vertices. There will always be faces*4 vertices, even
            if some of the faces could share vertices because all attributes are per vertex, and
            those values, such as normals, cannot be shared even if the vertex positions could be.

            each face is represented by two triangles using indexes and one set of uvs (4) for the whole
            face.
        */
        for (let i = 0; i < result.faces.length; ++i) {
            let q = result.faces[i]
            if (q.length === 5) {
                const uvs = app.textureManager.lookupUVsForBlockType(q[4])
                const a = q[0]
                const b = q[1]
                const c = q[2]
                const d = q[3]

                //make two triangles
                indices.push(a,b,d)
                indices.push(b,c,d)
                //set uvs for the whole quad
                for(let j=0; j<4; j++) {
                    //note that we are flipping y axis from canvas coords to opengl coords.
                    guvs.push(uvs[j][0], 1-uvs[j][1])
                }
            } else if (q.length === 4) {
                console.log("bad")
            }
        }
        geometry.setIndex(indices)
        geometry.addAttribute('position',new Float32BufferAttribute(vertices,3))
        geometry.addAttribute('uv', new Float32BufferAttribute(guvs,2))
        geometry.addAttribute('repeatx', new Float32BufferAttribute(repeatCount,1))

        if(result.faces.length > 0) console.log("geometry",geometry)

        geometry.computeFaceNormals()
        geometry.uvsNeedUpdate = true
        geometry.verticesNeedUpdate = true
        geometry.elementsNeedUpdate = true
        geometry.normalsNeedUpdate = true

        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()

    }

    createSurfaceMesh(material) {
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
