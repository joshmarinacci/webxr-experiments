import {t2 as T2} from "./t2.js"
import {LERP_TYPES, PROP_TYPES} from './t2.js'
const toRad = (deg) => deg * Math.PI/180

export default class FireBallAction {
    constructor(scene, controller, game) {
        this.clock = new THREE.Clock()
        this.enabled = false
        this.running = false
        this.game = game
        this.controller = controller

        this.initLauncher()
        this.startPressSphere = () => {
            if(!this.enabled)return
            if(game.ballcount >= 3) {
                this.running = false
                return
            }
            this.running = true
            this.clock.start()
        }
        this.endPressSphere = (e) => {
            if(!this.enabled)return
            if(!this.running) return
            this.running = false
            const strength = Math.min(1.0, this.clock.getElapsedTime() / 2.0)
            this.clock.stop()
            const endPoint = new THREE.Vector3(0,0,-1)
            controller.localToWorld(endPoint)
            const dirPoint = new THREE.Vector3(0,0,-1)
            dirPoint.applyQuaternion(controller.quaternion)
            dirPoint.normalize()
            const ball = game.blockService.fireBall(endPoint, dirPoint, strength)
            game.audioService.play('thunk')
            //move the sphere back
            // this.sphere.position.z = -1.0
            this.sphere.visible = false
            T2.sequence()
                .then(T2.wait(1.0))
                .then(()=>{
                    this.sphere.visible = true
                    this.sphere.position.z = -1.0
                })
                .then(T2.prop({
                    target:this.sphere,
                    property:'scale',
                    propertyType:PROP_TYPES.COMPOUND,
                    lerpType:LERP_TYPES.ELASTIC,
                    from:{x:0.01,y:0.01,z:0.01},
                    to:{x:1.0,y:1.0,z:1.0},
                    duration:1.0,
                }))
                .start()
        }
    }
    updatePressSphere(time) {
        if(!this.enabled)return
        if(!this.running) return
        this.sphere.position.z = -1.0+Math.min(this.clock.getElapsedTime(),1.0)
    }

    setEnabled(val) {
        this.enabled = val
    }

    resetBall() {
        if(this.sphere) {
            this.controller.remove(this.sphere)
        }
        this.sphere = this.game.blockService.generateBallMesh(this.game.blockService.ballRadius,this.game.blockService.ballType)
        this.sphere.position.z = -1.0
        this.controller.add(this.sphere)
    }

    initLauncher() {
        const geo = new THREE.CylinderGeometry(0.05,0.05,1.0,16)
        geo.rotateX(toRad(90))
        const tex = this.game.texture_loader.load('./textures/candycane.png')
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(1,10)

        const launcher = new THREE.Mesh(
            geo,
            new THREE.MeshStandardMaterial({
                color:'white',
                metalness:0.3,
                roughness:0.3,
                map:tex
            })
        )
        launcher.position.z = -0.5
        this.resetBall()
        this.controller.add(launcher)

    }
}
