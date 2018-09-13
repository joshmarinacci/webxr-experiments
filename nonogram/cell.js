import {STATES} from './nonogram.js'
import {POINTER_CLICK, POINTER_ENTER, POINTER_EXIT, Pointer} from './pointer.js'
import {TWEEN} from "./tween.js"

import {RESOURCES} from './resources.js'
import {playSound} from './resources.js'

const roundedRectShape = new THREE.Shape();
const roundedRectCurveSize = 0.95;

( function roundedRect( ctx, x, y, width, height, radius ) {

    ctx.moveTo( x, y + radius );
    ctx.lineTo( x, y + height - radius );
    ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
    ctx.lineTo( x + width - radius, y + height );
    ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
    ctx.lineTo( x + width, y + radius );
    ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
    ctx.lineTo( x + radius, y );
    ctx.quadraticCurveTo( x, y, x, y + radius );

} )( roundedRectShape, 0, 0, roundedRectCurveSize, roundedRectCurveSize, 0.2 );
const tilegeo = new THREE.ExtrudeBufferGeometry(roundedRectShape, {
    depth:0.1,
    bevelEnabled: false
})
tilegeo.translate(-roundedRectCurveSize/2, -roundedRectCurveSize/2,0)
const cell_material_highlight = new THREE.MeshLambertMaterial({color:0xffffff})
const cell_material_normal = new THREE.MeshLambertMaterial({color:0x444444})

export const CELL_GEOMETRIES = []
export const CELL_MATERIALS = []
export const CELL_TYPE = 'cell'

export default class GridCell extends THREE.Group {
    /*
     grid cell has three children:
        one for the tile itself
        one for the front decoration
        one for the back decoration
     */
    constructor(nonogram, x, y) {
        super()
        this.cellx = x
        this.celly = y
        const tile = new THREE.Mesh(tilegeo,cell_material_normal)
        tile.userData.type = 'tile'
        this.add(tile)
        let front = new THREE.Group()
        front.position.z = 0.15
        this.add(front)
        let back = new THREE.Group()
        back.position.z = -0.15
        this.add(back)

        function meshForState(state) {
            const mesh = new THREE.Mesh(CELL_GEOMETRIES[state],CELL_MATERIALS[state])
            mesh.jtype = CELL_TYPE
            return mesh
        }

        front.add(meshForState(STATES.UNKNOWN))
        back.add(meshForState(STATES.SELECTED))

        this.flipping = false

        this.on(tile,POINTER_ENTER,()=>{
            tile.material = cell_material_highlight
            playSound(RESOURCES.SOUNDS.hover)

        })
        this.on(tile,POINTER_EXIT,()=>{
            tile.material = cell_material_normal
        })
        this.on(tile,POINTER_CLICK,()=>{
            if(this.flipping) return
            //play the sound
            playSound(RESOURCES.SOUNDS.thunk)
            //update the state
            nonogram.rollCellState(x,y)
            const r = this.rotation.x
            //set a new back geometry
            back.remove(back.children[0])
            back.add(meshForState(nonogram.getCellState(x,y)))
            //flip
            this.flipping = true
            TWEEN.make({
                target:this.rotation,
                property:'x',
                from:r,
                to:r+Math.PI,
                duration:500,
            }).onEnd(()=>{
                //swap the references to front and back
                const temp = front
                front = back
                back = temp
                this.flipping = false
            })
        })


        this.solutionMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshLambertMaterial({color:'#dddddd', flatShading:true})
            )
        this.solutionMesh.visible = false
        this.add(this.solutionMesh)
    }

    on(obj, type, cb) {
        if(!obj.listeners) obj.listeners = {}
        if(!obj.listeners[type]) obj.listeners[type] = []
        obj.listeners[type].push(cb)
    }

}
