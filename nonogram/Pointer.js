export default class Pointer {
    constructor(scene, canvas, camera) {
        this.scene = scene
        this.canvas = canvas
        this.camera = camera

        this.raycaster = new THREE.Raycaster()
        this.waitcb = null


        this.canvas.addEventListener('mousemove',this.cameraFollowMouse.bind(this))
        this.canvas.addEventListener('click',this.mouseClick.bind(this))
    }

    fire(obj,type,payload) {
        if(!obj.listeners) return
        if(!obj.listeners[type]) return
        obj.listeners[type].forEach(cb => cb(payload))
    }

    cameraFollowMouse (e) {
        const bounds = this.canvas.getBoundingClientRect()
        const ry = ((e.clientX-bounds.left)/bounds.width)*2 - 1
        const rx = 1-((e.clientY-bounds.top)/bounds.height)*2
        this.camera.rotation.y = -ry
        this.camera.rotation.x = +rx
    }

    mouseClick(e) {
        if(this.waitcb) {
            this.waitcb()
            this.waitcb = null
            return
        }
        const mouse = new THREE.Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
        let fired = false
        intersects.forEach((it) => {
            // if(!fired) {
            this.fire(it.object, 'click', {type: 'click'})
            fired = true
            // }
        })
    }

    waitSceneClick(cb) {
        this.waitcb = cb
    }

}