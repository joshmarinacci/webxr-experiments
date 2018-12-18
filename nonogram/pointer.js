export const POINTER_ENTER = "enter"
export const POINTER_EXIT = "exit"
export const POINTER_CLICK = "click"

export class Pointer {
    constructor(scene, renderer, camera, opts) {
        this.opts = opts || {}
        this.scene = scene
        this.renderer = renderer
        this.canvas = renderer.domElement
        this.camera = camera

        this.raycaster = new THREE.Raycaster()
        this.waitcb = null
        this.hoverTarget = null

        this.intersectionFilter = this.opts.intersectionFilter || ((o) => true)



        // setup the mouse
        this.canvas.addEventListener('mousemove', (e)=>{
            this.mouseMove(e)
            this.cameraFollowMouse(e)
        })
        this.canvas.addEventListener('click', this.mouseClick.bind(this))

        // setup the VR controllers
        this.controller1 = this.renderer.vr.getController(0);
        this.controller1.addEventListener('selectstart', this.controllerSelectStart.bind(this));
        this.controller1.addEventListener('selectend', this.controllerSelectEnd.bind(this));
        this.scene.add(this.controller1);

        this.controller2 = this.renderer.vr.getController(1);
        this.controller2.addEventListener('selectstart', this.controllerSelectStart.bind(this));
        this.controller2.addEventListener('selectend', this.controllerSelectEnd.bind(this));
        this.scene.add(this.controller2);


        //create visible lines for the two controllers
        const geometry = new THREE.BufferGeometry()
        geometry.addAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -4], 3));
        geometry.addAttribute('color', new THREE.Float32BufferAttribute([1.0, 0.5, 0.5, 0, 0, 0], 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: false,
            linewidth: 5,
            blending: THREE.AdditiveBlending
        })

        this.controller1.add(new THREE.Line(geometry, material));
        this.controller2.add(new THREE.Line(geometry, material));
    }

    //override this to do something w/ the controllers on every tick
    tick(time) {
        this.controllerMove(this.controller1)
        this.controllerMove(this.controller2)
    }


    fire(obj, type, payload) {
        if (!obj.listeners) return
        if (!obj.listeners[type]) return
        obj.listeners[type].forEach(cb => cb(payload))
    }

    //make the camera follow the mouse in desktop mode. Helps w/ debugging.
    cameraFollowMouse(e) {
        const bounds = this.canvas.getBoundingClientRect()
        const ry = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        const rx = 1 - ((e.clientY - bounds.top) / bounds.height) * 2
        this.camera.rotation.y = -ry
        this.camera.rotation.x = +rx
    }

    mouseMove(e) {
        const mouse = new THREE.Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        this._processMove()
    }

    controllerMove(controller) {
        const c = controller
        const dir = new THREE.Vector3(0, 0, -1)
        dir.applyQuaternion(c.quaternion)
        this.raycaster.set(c.position, dir)
        this._processMove()
    }

    _processMove() {
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
        intersects.forEach((it) => {
            const obj = it.object
            if(!obj) return
            const valid = this.intersectionFilter(obj)
            // const valid = false
            if(valid) {
                if (obj === this.hoverTarget) {
                    //still inside
                } else {
                    if (this.hoverTarget)
                        this.fire(this.hoverTarget, POINTER_EXIT, {type: POINTER_EXIT})
                    this.hoverTarget = obj
                    this.fire(this.hoverTarget, POINTER_ENTER, {type: POINTER_ENTER})
                }
            }
        })
    }

    _processClick() {
        if (this.waitcb) {
            this.waitcb()
            this.waitcb = null
            return
        }

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
        intersects.forEach((it) => {
            const valid = this.intersectionFilter(it.object)
            if(valid) this.fire(it.object, POINTER_CLICK, {type: POINTER_CLICK})
        })
    }
    mouseClick(e) {
        const mouse = new THREE.Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        this._processClick()
    }

    controllerSelectStart(e) {
        e.target.userData.isSelecting = true;
    }

    controllerSelectEnd(e) {
        e.target.userData.isSelecting = false;
        const c = e.target
        const dir = new THREE.Vector3(0, 0, -1)
        dir.applyQuaternion(c.quaternion)
        this.raycaster.set(c.position, dir)
        this._processClick()
    }

    waitSceneClick(cb) {
        this.waitcb = cb
    }

}
