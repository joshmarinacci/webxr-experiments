export default class FireBallAction {
    constructor(scene, controller, blockService) {
        this.clock = new THREE.Clock()
        this.press_sphere = null
        this.enabled = false
        this.startPressSphere = () => {
            if(!this.enabled)return
            this.clock.start()
            this.press_sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.2),
                new THREE.MeshLambertMaterial({color: 'red'})
            )
            this.press_sphere.scale.set(0.1, 0.1, 0.1)
            this.press_sphere.position.set(0, 2, -2)
            scene.add(this.press_sphere)
        }
        this.endPressSphere = (e) => {
            if(!this.enabled)return
            scene.remove(this.press_sphere)
            const strength = Math.min(1.0, this.clock.getElapsedTime() / 2.0)
            this.clock.stop()
            const ball = blockService.fireBall(controller.position, e.point.clone(), strength)
            //remove the ball after 3 sec
            setTimeout(() => blockService.removeBall(ball), 10 * 1000)
        }
    }
    updatePressSphere(time) {
        if(!this.enabled)return
        if (this.press_sphere) {
            const strength = Math.min(1.0, this.clock.getElapsedTime() / 2.0)
            this.press_sphere.scale.set(strength, strength, strength)
        }
    }

    setEnabled(val) {
        this.enabled = val
    }
}
