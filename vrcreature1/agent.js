const angleTo = function (qthis,q) {
    var p = new THREE.Quaternion();
    p.copy(q).inverse();
    p.premultiply(qthis);
    return 2 * Math.acos(p.w);
}

// const UP = new THREE.Vector3(0,1,0)

const TAIL_LENGTH = 5
const TAIL_FRAME_SPACING=20
AFRAME.registerComponent("agent",{
    init: function() {
        this.up = new THREE.Vector3(0,1,0).normalize()
        this.currentHeading = new THREE.Vector3(0,1,0).normalize()
        this.currentRot = new THREE.Quaternion()
        this.currentRot.setFromAxisAngle(this.up, 0)
        this.targeting = false
        this.target = null
        this.speed = 0.05

        const head_len = 1.0
        const head_geo = new THREE.ConeGeometry(0.5, head_len, 16)
        head_geo.translate(0,head_len,0)
        const head_mat = new THREE.MeshPhongMaterial({color: 0x421C52})
        head_mat.flatShading = true
        this.head = new THREE.Mesh(head_geo,head_mat)
        this.head.position.z = -5
        this.el.object3D.add(this.head)

        this.tail = []
        for(let i=0; i<TAIL_LENGTH; i++) {
            const s = 0.5
            var geometry = new THREE.SphereGeometry(s,8,8);
            var material = new THREE.MeshPhongMaterial({color: 0x732C7B});
            material.flatShading = true
            var cube = new THREE.Mesh(geometry, material);
            this.tail.push(cube)
            this.el.object3D.add(cube)
        }

        this.positions = []
        for(let i=0; i<TAIL_LENGTH*TAIL_FRAME_SPACING; i++) {
            this.positions.push(new THREE.Vector3(0,0,0))
        }
        this.orientations = []
        for(let i=0; i<TAIL_LENGTH*TAIL_FRAME_SPACING; i++) {
            this.orientations.push(new THREE.Quaternion())
        }

        this.currentIndex = 0
    },

    setColor: function(c) {
        const hsl = {}
        this.head.material.color.set(c)
        this.head.material.color.getHSL(hsl)
        this.tail.forEach((seg,i) => {
            const l = 1-i/this.tail.length
            seg.material.color.setHSL(hsl.h,hsl.s,l*hsl.l)
        })
    },

    doRandom: function() {
        //create a new rotation
        const q = new THREE.Quaternion()
        const v = new THREE.Vector3(-1,0,0)
        q.setFromAxisAngle(v,this.speed).normalize()

        //apply rotation to orientation and current heading
        this.head.quaternion.multiply(q)
        this.currentHeading.copy(this.up)
        this.currentRot.copy(this.head.quaternion)
        this.currentHeading.applyQuaternion(this.currentRot)

        //move in the direction of the current heading
        const moveHeading = this.currentHeading.clone()
        moveHeading.multiplyScalar(this.speed)
        this.head.position.add(moveHeading)

        this.updateTail()
    },

    updateTail:function() {
        this.positions[this.currentIndex].copy(this.head.position)
        this.orientations[this.currentIndex].copy(this.head.quaternion)
        this.tail.forEach((tailSegment, i) => {
            let index = (this.currentIndex-i*TAIL_FRAME_SPACING)%this.positions.length
            if(index < 0) index += this.positions.length
            tailSegment.position.copy(this.positions[index])
            tailSegment.quaternion.copy(this.orientations[index])
        })


        this.currentIndex = (this.currentIndex + 1) % this.positions.length
    },

    doTarget: function() {
	    if(!this.target) return
	    
        //const sphere = document.querySelector('#sphere')
        const sphere = this.target
        const targetPos = sphere.object3D.position
        const currentPos = this.head.position
        const dist = currentPos.distanceTo(targetPos)
        //if close enough, stop targeting
        if(dist < 0.1) {
            //console.log("====== emitting")
            this.targeting = false
            this.el.emit('collide')
            return
        }

        //calculate the target heading
        const targetHeading = new THREE.Vector3()
        targetHeading.copy(targetPos)
        targetHeading.sub(currentPos)
        targetHeading.normalize()


        const targetRot = new THREE.Quaternion()
        targetRot.setFromUnitVectors(this.up, targetHeading).normalize()

        let angle = angleTo(this.head.quaternion,targetRot)
        const t = (angle>0.1)?0.1:1.0
        THREE.Quaternion.slerp(this.currentRot, targetRot, this.head.quaternion, t)
        this.currentRot.copy(this.head.quaternion)

        //move towards the target
        this.currentHeading.copy(this.up)
        this.currentHeading.applyQuaternion(this.currentRot)
        const moveHeading = this.currentHeading.clone()
        moveHeading.multiplyScalar(this.speed)
        currentPos.add(moveHeading)

        this.updateTail()
    },

    tick: function() {
        if(this.targeting) return this.doTarget()
        this.doRandom()
    }
})

