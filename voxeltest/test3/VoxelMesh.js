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
        const repeatUV = []
        const subrects = []

        //copy all verticies in from meshed data
        for (let i = 0; i < result.vertices.length; ++i) {
            let q = result.vertices[i]
            vertices.push(q[0],q[1],q[2])
        }

        const indices = []
        const normaluvs = []
        const frameCount = []
        // if(result.faces.length > 0) console.log(result)
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

                let repU = 1
                let repV = 1
                const size = this.faceVertexUv(i)
                if(size.x > 0 && size.y > 0) {
                    // console.log("front or back", size)
                    repU = size.x
                    repV = size.y
                }

                if(size.z > 0 && size.x > 0) {
                    // console.log("top or bottom")
                    repU = size.z
                    repV = size.x
                }

                if(size.z > 0 && size.y > 0) {
                    // console.log("left or right")
                    repU = size.z
                    repV = size.y
                }
                for(let j=0; j<4; j++) {
                    repeatUV.push(repU, repV);
                }

                //set standard uvs for the whole quad
                normaluvs.push(0,0, 1,0, 1,1, 0,1)

                const rect = {
                    x:uvs[0][0],
                    y:1.0 - uvs[0][1],
                    w:uvs[1][0] - uvs[0][0],
                    h:uvs[2][1] - uvs[1][1],
                }
                //flip the y axis properly
                rect.y = 1.0 - uvs[0][1] - rect.h
                for(let j=0; j<4; j++) {
                    subrects.push(rect.x,rect.y,rect.w,rect.h)
                }

                for(let j=0; j<4; j++) {
                    frameCount.push(1)
                }
            } else if (q.length === 4) {
                console.log("bad")
            }
        }
        geometry.setIndex(indices)
        geometry.addAttribute('position',new Float32BufferAttribute(vertices,3))
        geometry.addAttribute('uv', new Float32BufferAttribute(normaluvs,2))
        geometry.addAttribute('subrect',new Float32BufferAttribute(subrects,4))
        geometry.addAttribute('repeat', new Float32BufferAttribute(repeatUV,2))
        geometry.addAttribute('frameCount',new Float32BufferAttribute(frameCount,1))

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
        // console.log("size",size)
        return size
        /*
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
        */
    }
}
