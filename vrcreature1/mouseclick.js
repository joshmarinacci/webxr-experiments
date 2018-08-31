AFRAME.registerComponent("mouseclick",{
    init: function() {
        this.raycaster = new THREE.Raycaster()
        this.el.sceneEl.canvas.addEventListener('click',(e)=>{
            const canvas = this.el.sceneEl.canvas
            const camera = this.el.sceneEl.camera
            const mouse = new THREE.Vector2()
            const bounds = canvas.getBoundingClientRect()
            mouse.x =   ((e.clientX-bounds.left) / bounds.width  ) * 2 - 1;
            mouse.y = - ((e.clientY-bounds.top)  / bounds.height ) * 2 + 1;
            this.raycaster.setFromCamera( mouse, camera );
            const intersects = this.raycaster.intersectObjects( this.el.sceneEl.object3D.children, true );
            intersects.forEach((it)=>{
                if(it.distance > 0) {
                    it.object.el.emit('click',{intersection:it} )
                }
            })
        })
    }
})
