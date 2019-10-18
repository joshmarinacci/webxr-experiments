
/*
//create a grid map
//run some tests on it
//draw it on a canvas
fill with noise
smooth out the noise
color based on height and terrain
*/


export class Point {
    constructor(x,y) {
        this.x = x
        this.y = y
    }

    add(point) {
        return new Point(
            this.x+point.x,
            this.y+point.y
        )
    }
    subtract(point) {
        return new Point(
            this.x-point.x,
            this.y-point.y
        )
    }
    copy(pt) {
        this.x = pt.x
        this.y = pt.y
        return this
    }
    toString() {
        return `point(${this.x},${this.y})`
    }
}

export class Cube {
    constructor(x,y,z) {
        this.x = x
        this.y = y
        this.z = z
    }

    round() {
        let rx = Math.round(this.x)
        let ry = Math.round(this.y)
        let rz = Math.round(this.z)

        const x_diff = Math.abs(rx - this.x)
        const y_diff = Math.abs(ry - this.y)
        const z_diff = Math.abs(rz - this.z)

        if ( x_diff > y_diff && x_diff > z_diff) {
            rx = -ry-rz
        } else if ( y_diff > z_diff) {
            ry = -rx-rz
        } else {
            rz = -rx-ry
        }
        return new Cube(rx,ry,rz)
    }
}

export class Hex {
    constructor(q,r) {
        this.q = q
        this.r = r
    }
    round() {
        return cube_to_axial(axial_to_cube(this).round())
    }
    toString() {
        return `hex(${this.q},${this.r})`
    }
}

export class HexMap {
    constructor() {
        this._storage = {}
    }

    set(hexCoord, data) {
        this._storage[this.hexHash(hexCoord)] = {hex:hexCoord,data:data}
    }
    get(hexCoord) {
        const hash = this.hexHash(hexCoord)
        if(!hash) return null
        if(!this._storage[hash]) return null
        return this._storage[hash].data
    }

    hexHash(hexCoord) {
        return hexCoord.q + "_" + hexCoord.r
    }

    forEachPair(cb) {
        Object.keys(this._storage).forEach(key => {
            const val = this._storage[key]
            cb(val.hex,val.data)
        })
    }
    dump() {
        console.log("the map")
        console.log("length", Object.keys(this._storage).length)
        this.forEachPair((hex,data)=>{
            console.log(hex.toString(),data)
        })
    }
    findAdjacent(hexCoords) {
        const arr = []
        for(let i=0; i<6; i++) {
            arr[i] = hex_neighbor(hexCoords,i)
        }
        return arr
    }
}

export function toRad(theta) {
    return theta*Math.PI/180.0
}

export function pointy_hex_corner(center, size, i) {
    const angle = toRad(60*i-30)
    return new Point(
        center.x + size * Math.cos(angle),
        center.y + size * Math.sin(angle)
        )
}

export function cube_to_axial(cube) {
    return new Hex(cube.x,cube.z)
}
export function axial_to_cube(hex) {
    const x = hex.q
    const z = hex.r
    const y = -x-z
    return new Cube(x,y,z)
}

const cube_directions = [
    new Cube(+1,-1,0), new Cube(+1,0,-1), new Cube(0,+1,-1),
    new Cube(-1,+1,0), new Cube(-1,0,+1), new Cube(0,-1,+1)
]

export function cube_direction(direction) {
    return cube_directions[direction]
}
export function cube_neighbor(cube,direction) {
    return cube_add(cube, cube_direction(direction))
}
const axial_directions = [
    new Hex(+1,0), new Hex(+1,-1), new Hex(0,-1),
    new Hex(-1,0), new Hex(-1,+1), new Hex(0,+1),
]

function hex_direction(direction) {
    return axial_directions[direction]
}
function hex_neighbor(hex, direction) {
    const dir = hex_direction(direction)
    return new Hex(hex.q+dir.q, hex.r+dir.r)
}


const Q_BASIS_VECTOR = new Point(Math.sqrt(3),0)
const R_BASIS_VECTOR = new Point(Math.sqrt(3)/2,3/2)

export function pointy_hex_to_pixel(hex,size) {
    const x = size * (Q_BASIS_VECTOR.x*hex.q + R_BASIS_VECTOR.x*hex.r)
    const y = size * (Q_BASIS_VECTOR.y*hex.q + R_BASIS_VECTOR.y*hex.r)
    return new Point(x,y)
}

export function pixel_to_pointy_hex(pt, SIZE) {
    const q = (Math.sqrt(3)/3 * pt.x - 1/3 * pt.y)/SIZE
    const r = (                          2/3 * pt.y)/SIZE
    return new Hex(q,r).round()
}
