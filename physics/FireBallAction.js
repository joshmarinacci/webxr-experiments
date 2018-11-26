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
            //remove the ball after 10 sec
            setTimeout(() => game.blockService.removeBall(ball), 5 * 1000)
            this.sphere.position.z = -1.0
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
        const geo = new THREE.BoxGeometry(0.1,0.1,1.0)
        const launcher = new THREE.Mesh(
            geo,
            new THREE.MeshLambertMaterial({color:'green'})
        )
        launcher.position.z = -0.5
        this.resetBall()
        this.controller.add(launcher)

    }
}
