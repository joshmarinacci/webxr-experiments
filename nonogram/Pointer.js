export default class Pointer {
    constructor(scene, renderer, camera) {
        this.scene = scene
        this.renderer = renderer
        this.canvas = renderer.domElement
        this.camera = camera

        this.raycaster = new THREE.Raycaster()
        this.waitcb = null


        this.canvas.addEventListener('mousemove', this.cameraFollowMouse.bind(this))
        this.canvas.addEventListener('click', this.mouseClick.bind(this))

        // controllers

        // const rc = new THREE.Raycaster()


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

    tick(time) {
        // function handleController( controller ) {
        //     if ( controller.userData.isSelecting ) {
        /*
        var object = room.children[ 0 ];
        room.remove( object );
        object.position.copy( controller.position );
        object.userData.velocity.x = ( Math.random() - 0.5 ) * 0.02;
        object.userData.velocity.y = ( Math.random() - 0.5 ) * 0.02;
        object.userData.velocity.z = ( Math.random() * 0.02 - 0.1 );
        object.userData.velocity.applyQuaternion( controller.quaternion );
        room.add( object );
        */
        // }
        // }

        // handleController( this.controller1 );
        // handleController( this.controller2 );

    }


    fire(obj, type, payload) {
        if (!obj.listeners) return
        if (!obj.listeners[type]) return
        obj.listeners[type].forEach(cb => cb(payload))
    }

    cameraFollowMouse(e) {
        const bounds = this.canvas.getBoundingClientRect()
        const ry = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        const rx = 1 - ((e.clientY - bounds.top) / bounds.height) * 2
        this.camera.rotation.y = -ry
        this.camera.rotation.x = +rx
    }

    mouseClick(e) {
        if (this.waitcb) {
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

    controllerSelectStart(e) {
        e.target.userData.isSelecting = true;

        if (this.waitcb) {
            this.waitcb()
            this.waitcb = null
            return
        }


        const c = e.target
        const origin = c.position
        const dir = new THREE.Vector3(0, 0, -1)
        dir.applyQuaternion(c.quaternion)
        this.raycaster.set(c.position, dir)

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
        let fired = false
        intersects.forEach((it) => {
            // if(!fired && it.object.jtype) {
            console.log(it)
            this.fire(it.object, 'click', {type: 'click'})
            fired = true
            // }
        })

    }

    controllerSelectEnd(e) {
        e.target.userData.isSelecting = false;
    }

    waitSceneClick(cb) {
        this.waitcb = cb
    }

}