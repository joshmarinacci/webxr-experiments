import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry} from "./node_modules/three/build/three.module.js"
import {GameState, GameStateEnums} from './logic2.js'
import {ThreeCore} from './threesystem.js'
import {Level} from './levelssystem.js'


export  class Instructions3D {
    constructor() {
        this.context = null
        this.canvas = null
    }
    getContext2D() {
        return this.context
    }
    getCanvas() {
        return this.canvas
    }

}
export class Instructions3DSystem extends System {
    init() {
        this.lastMode = GameStateEnums.NONE
    }
    execute() {
        this.queries.instructions.added.forEach(ent => {
            const inst = ent.getMutableComponent(Instructions3D)
            inst.canvas = document.createElement('canvas')
            inst.width = 512
            inst.height = 256
            inst.canvas.width = inst.width
            inst.canvas.height = inst.height
            inst.context = inst.canvas.getContext('2d')
            inst.lastDraw = 0
            inst.ctex = new CanvasTexture(inst.canvas)
            inst.obj = new Mesh(
                new PlaneGeometry(2.0,1.0),
                new MeshBasicMaterial({map:inst.ctex})
            )
            inst.obj.position.z = -3
            inst.obj.position.y = 1.0
            inst.obj.position.x = 0
            inst.obj.material.depthTest = false
            inst.obj.material.depthWrite = false
            inst.obj.renderOrder = 1000
            inst.customProps = {}

            const c = inst.getContext2D()
            c.fillStyle = 'white'
            c.fillRect(0,0,inst.canvas.width,inst.canvas.height)

            inst.obj.visible = false

            const core = this.queries.three.results[0].getComponent(ThreeCore)
            core.scene.add(inst.obj)
        })

        this.queries.state.results.forEach(ent => {
            const state = ent.getMutableComponent(GameState)
            this.queries.instructions.results.forEach(ent2 => {
                const inst = ent2.getMutableComponent(Instructions3D)
                if(state.mode !== this.lastMode) {
                    if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) {
                        inst.obj.visible = true
                        this.drawInstructions(inst,ent.getComponent(Level))
                    }
                    if(state.isMode(GameStateEnums.SHOW_WIN)) {
                        inst.obj.visible = true
                        this.drawWinLevel(inst,ent.getComponent(Level))
                    }
                    if(state.isMode(GameStateEnums.WON_GAME)) {
                        inst.obj.visible = true
                        this.drawWonGame(inst,ent.getComponent(Level))
                    }
                    if(state.isMode(GameStateEnums.PLAY)) {
                        inst.obj.visible = false
                    }
                    this.lastMode = state.mode
                }
            })
        })
    }

    drawInstructions(view, level) {
        const c = view.getContext2D()
        const can = view.getCanvas()
        c.fillStyle = 'white'
        const s = 10
        c.save()
        c.translate(s,s)
        c.fillRect(0,0,view.width-s*2,view.height-s*2)
        c.fillStyle = 'black'
        c.strokeRect(0,0,view.width-s*2,view.height-s*2)

        const padding = {left:5, top:5}
        const lineHeight = 20
        c.font = '25px serif'
        c.fillText(level.instructions, padding.left, padding.top+lineHeight)
        c.restore()
        view.ctex.needsUpdate = true
    }

    drawWinLevel(view, component) {
        const c = view.getContext2D()
        const can = view.getCanvas()
        c.fillStyle = 'white'
        const s = 10
        c.save()
        c.translate(s,s)
        c.fillRect(0,0,view.width-s*2,view.height-s*2)
        c.fillStyle = 'black'
        c.strokeRect(0,0,view.width-s*2,view.height-s*2)

        const padding = {left:5, top:5}
        const lineHeight = 20
        c.font = '25px serif'
        c.fillText('Level complete!', padding.left, padding.top+lineHeight)
        c.fillText('Click to continue', padding.left, padding.top+lineHeight*2)
        c.restore()
        view.ctex.needsUpdate = true
    }

    drawWonGame(view, component) {
        const c = view.getContext2D()
        const can = view.getCanvas()
        c.fillStyle = 'white'
        const s = 10
        c.save()
        c.translate(s,s)
        c.fillRect(0,0,view.width-s*2,view.height-s*2)
        c.fillStyle = 'black'
        c.strokeRect(0,0,view.width-s*2,view.height-s*2)

        const padding = {left:5, top:5}
        const lineHeight = 20
        c.font = '25px serif'
        c.fillText('You won the game!', padding.left, padding.top+lineHeight)
        c.fillText('Click to restart', padding.left, padding.top+lineHeight*2)
        c.restore()
        view.ctex.needsUpdate = true
    }
}

Instructions3DSystem.queries = {
    instructions: {
        components:[Instructions3D],
        listen: {
            added:true,
            removed:true,
        }
    },
    three: {
        components:[ThreeCore]
    },
    state: {
        components:[GameState,Level]
    }
}
