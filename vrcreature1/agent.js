const angleTo = function (qthis,q) {
    var p = new THREE.Quaternion();
    p.copy(q).inverse();
    p.premultiply(qthis);
    return 2 * Math.acos(p.w);
}

// const UP = new THREE.Vector3(0,1,0)

AFRAME.registerComponent("agent",{
    init: function() {
        this.up = new THREE.Vector3(0,1,0).normalize()
        this.currentHeading = new THREE.Vector3(0,1,0).normalize()
        this.currentRot = new THREE.Quaternion()
        this.currentRot.setFromAxisAngle(this.up, 0)
        this.targeting = false
        this.speed = 0.05
    },

    doRandom: function() {
        //create a new rotation
        const q = new THREE.Quaternion()
        const v = new THREE.Vector3(-1,0,0)
        q.setFromAxisAngle(v,this.speed).normalize()

        //apply rotation to orientation and current heading
        this.el.object3D.quaternion.multiply(q)
        this.currentHeading.copy(this.up)
        this.currentRot.copy(this.el.object3D.quaternion)
        this.currentHeading.applyQuaternion(this.currentRot)

        //move in the direction of the current heading
        const currentPos = this.el.object3D.position
        const moveHeading = this.currentHeading.clone()
        moveHeading.multiplyScalar(this.speed)
        currentPos.add(moveHeading)
    },

    doTarget: function() {
        const sphere = document.querySelector('#sphere')
        const targetPos = sphere.object3D.position
        const currentPos = this.el.object3D.position
        const dist = currentPos.distanceTo(targetPos)
        //if close enough, stop targeting
        //console.log("distance",dist)
        if(dist < 0.5) {
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

        let angle = angleTo(this.el.object3D.quaternion,targetRot)
        const t = (angle>0.1)?0.1:1.0
        THREE.Quaternion.slerp(this.currentRot, targetRot, this.el.object3D.quaternion, t)
        this.currentRot.copy(this.el.object3D.quaternion)

        //move towards the target
        this.currentHeading.copy(this.up)
        this.currentHeading.applyQuaternion(this.currentRot)
        const moveHeading = this.currentHeading.clone()
        moveHeading.multiplyScalar(this.speed)
        currentPos.add(moveHeading)
    },

    tick: function() {
        if(this.targeting) {
            this.doTarget()
        } else {
            //console.log('random')
            this.doRandom()
        }
        return;
    }
})

