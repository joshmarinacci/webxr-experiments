import {
    AdditiveBlending,
    BufferGeometry,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    Raycaster,
    Vector3
} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {Button3D, HexMapView} from './hex3dsystem.js'
import {TERRAINS} from './globals.js'
import {makeTree} from './hex3dsystem.js'
import {
    CommandComp,
    COMMANDS,
    DirtTile,
    ForestTile,
    GameState,
    GameStateEnums,
    HexMapComp,
    InputModes
} from './logic2.js'

class VRController {
    constructor() {
        this.vrid = -1
        this.prevPressed = false
        this.pressed = false
    }
}

export class VRInputSystem extends System {
    init() {
        this.raycaster = new Raycaster()
    }
    execute() {
        if(!this.started) {
            this.started = true
            this.world.createEntity().addComponent(VRController,{vrid:0})
            this.world.createEntity().addComponent(VRController,{vrid:1})
        }

        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        this.queries.controllers.added.forEach(ent => {
            const con = ent.getMutableComponent(VRController)
            con.controller = core.renderer.vr.getController(con.vrid)
            con.controller.addEventListener('selectstart', () => {
                con.pressed = true
            })
            con.controller.addEventListener('selectend', () => {
                con.pressed = false
            })
            core.scene.add(con.controller)

            const geometry = new BufferGeometry()
            geometry.addAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0,  0, 0,-4], 3 ) );
            geometry.addAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
            const material = new LineBasicMaterial( { vertexColors: true, blending: AdditiveBlending } );
            con.controller.add( new Line( geometry, material ) );
        })
        this.queries.controllers.results.forEach(ent => {
            const cont = ent.getMutableComponent(VRController)
            this.updateGP(core,cont)
            this.updatePointing(core,cont)
            this.updateClick(core,cont)
        })
    }

    findHexAtController(core,controller) {
        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(controller.quaternion)
        this.raycaster.set(controller.position, dir)
        const intersects = this.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(it.object.userData.hex) {
                return {hex:it.object.userData.hex, node:it.object}
            }
        }
        return {}
    }

    updatePointing(core,controller) {
        const {hex,node} = this.findHexAtController(core,controller.controller)
        if(hex) {
            if(this.current) {
                this.current.material.color.set(this.current.userData.regularColor)
            }
            this.current = node
            node.material.color.set('red')
        }
    }

    findObjectAtController(core,controller,filter) {
        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(controller.quaternion)
        this.raycaster.set(controller.position, dir)
        const intersects = this.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(filter(it)) return it
        }
        return null
    }

    updateClick(core, cont) {
        if(cont.prevPressed === false && cont.pressed === true) {
            console.log("Processing a controller click")
            cont.prevPressed = cont.pressed
            const state = this.queries.state.results[0].getMutableComponent(GameState)
            if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) return state.toMode(GameStateEnums.PLAY)
            if(state.isMode(GameStateEnums.SHOW_WIN)) return state.toMode(GameStateEnums.NEXT_LEVEL)
            if(state.isMode(GameStateEnums.WON_GAME)) return


            const it = this.findObjectAtController(core,cont.controller,(i => i.object.userData.type === 'Button3D'))
            if(it) {
                const button = it.object.userData.ent.getComponent(Button3D)
                if(button.onClick) button.onClick()
                return
            }

            const {hex,node} = this.findHexAtController(core,cont.controller)
            if(!hex) return
            const mapView = this.queries.map.results[0].getMutableComponent(HexMapComp)
            const data = mapView.map.get(hex)
            const ent = data.ent
            if(ent.hasComponent(DirtTile)) {
                console.log("checking input",state.inputMode)
                if(state.inputMode === InputModes.PLANT_FOREST)
                    ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FOREST, hex: hex, data: data })
                if(state.inputMode === InputModes.PLANT_FARM)
                    ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FARM, hex: hex, data: data })
            }
            if(state.inputMode === InputModes.CHOP_WOOD && ent.hasComponent(ForestTile)) {
                ent.addComponent(CommandComp, { type: COMMANDS.CHOP_WOOD, hex: hex, data: data })
            }
            if(state.inputMode === InputModes.BUILD_CITY && ent.hasComponent(DirtTile)) {
                ent.addComponent(CommandComp, { type: COMMANDS.BUILD_CITY, hex: hex, data: data })
            }
        }
        cont.prevPressed = cont.pressed
    }

    updateGP(core, con) {
        function findGamepad( id ) {
            // Iterate across gamepads as Vive Controllers may not be
            // in position 0 and 1.
            var gamepads = navigator.getGamepads && navigator.getGamepads();
            for ( var i = 0, j = 0; i < gamepads.length; i ++ ) {
                var gamepad = gamepads[ i ];
                if ( gamepad && ( gamepad.id === 'OpenVR Gamepad' || gamepad.id.startsWith( 'Oculus Touch' ) || gamepad.id.startsWith( 'Spatial Controller' ) ) ) {
                    if ( j === id ) return gamepad;
                    j ++;
                }
            }
        }
        const gamepad = findGamepad(con.vrid)
        if(gamepad) {
//              console.log("trigger", gamepad.buttons[1].pressed)
//             console.log("grip", gamepad.buttons[2].pressed)
//             console.log("menu", gamepad.buttons[3].pressed)
//             console.log(gamepad.axes[0],gamepad.axes[1])

            //if not left or right too far then do forward back
            const thresh = 0.4
            if(gamepad.axes[0]>-thresh && gamepad.axes[0]<thresh) {
                if (gamepad.axes[1] < -thresh) {
                    this.queries.three.results.forEach(ent => ent.getMutableComponent(ThreeCore).stagePos.position.z += 0.2)
                }
                if (gamepad.axes[1] > +thresh) {
                    this.queries.three.results.forEach(ent => ent.getMutableComponent(ThreeCore).stagePos.position.z -= 0.2)
                }
                return
            }
            if(gamepad.axes[1] >-thresh && gamepad.axes[1] < thresh) {
                if(gamepad.axes[0]<-thresh) {
                    this.queries.three.results.forEach(ent => ent.getMutableComponent(ThreeCore).stageRot.rotation.y -= 0.05)
                }
                if(gamepad.axes[0]>+thresh) {
                    this.queries.three.results.forEach(ent => ent.getMutableComponent(ThreeCore).stageRot.rotation.y += 0.05)
                }
            }
        }
    }
}

VRInputSystem.queries = {
    three: {
        components: [ThreeCore]
    },
    controllers: {
        components:[VRController],
        listen: {
            added:true,
            removed:true,
        }
    },
    state: {
        components:[GameState]
    },
    map: {
        components: [HexMapComp]
    }
}
