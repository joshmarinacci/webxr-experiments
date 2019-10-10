import {
    BufferGeometry,
    CylinderGeometry,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    Mesh,
    MeshStandardMaterial,
    NormalBlending,
    Object3D,
    RepeatWrapping,
    TextureLoader,
    Vector3
} from "./node_modules/three/build/three.module.js"


function printError(err) {
    console.log(err)
}

export const VR_DETECTED = "detected"
export const VR_CONNECTED = "connected"
export const VR_DISCONNECTED = "disconnected"
export const VR_PRESENTCHANGE = "presentchange"
export const VR_ACTIVATED = "activated"


export class VRManager {
    constructor(renderer) {
        this.device = null
        this.renderer = renderer
        if(!this.renderer) throw new Error("VR Manager requires a valid ThreeJS renderer instance")
        this.listeners = {}

        if ('xr' in navigator) {
            console.log("has webxr",navigator.xr)
            navigator.xr.supportsSession("immersive-vr")
                    .then((val) => {
                        console.log('return from supports session ',val)
                        // navigator.xr.requestSession('immersive-vr').then(val => {
                        //     console.log('return from request sessionr ',val)
                        // })
                        // this.device = device
                        this.fire(VR_DETECTED,{})
                    })
                    .catch(printError);

        } else if ('getVRDisplays' in navigator) {
            console.log("has webvr")

            window.addEventListener( 'vrdisplayconnect', ( event ) => {
                this.device = event.display
                this.fire(VR_CONNECTED)
            }, false );

            window.addEventListener( 'vrdisplaydisconnect', ( event )  => {
                this.fire(VR_DISCONNECTED)
            }, false );

            window.addEventListener( 'vrdisplaypresentchange', ( event ) => {
                console.log("got present change on device. ",this.device.isPresenting)
                this.fire(VR_PRESENTCHANGE,{isPresenting:this.device.isPresenting})
            }, false );

            window.addEventListener( 'vrdisplayactivate',  ( event ) => {
                this.device = event.display
                this.device.requestPresent([{source:this.renderer.domElement}])
                this.fire(VR_ACTIVATED)
            }, false );

            navigator.getVRDisplays()
                .then( ( displays ) => {
                    console.log("vr scanned. found ", displays.length, 'displays')
                    if ( displays.length > 0 ) {

                        // showEnterVR( displays[ 0 ] );
                        console.log("found vr",displays[0])
                        this.device = displays[0]
                        this.fire(VR_DETECTED,{})

                    } else {
                        console.log("no vr at all")
                        // showVRNotFound();
                    }

                } ).catch(printError);

        } else {
            // no vr
            console.log("no vr at all")
        }
    }

    addEventListener(type, cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    fire(type,evt) {
        if(!evt) evt = {}
        evt.type = type
        console.log("Firing",type,JSON.stringify(evt))
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(evt))
    }

    enterVR() {
        console.log("trying to enter VR")
        navigator.xr.requestSession('immersive-vr').then(e=>{
            console.log("got the event",e)
        })
        // if(!this.device) {
        //     console.warn("tried to connect VR on an invalid device")
        //     return
        // }
        // console.log("entering VR")
        // const prom = this.renderer.vr.setDevice( this.device );
        // console.log('promise is',prom)
        //
        // if(this.device.isPresenting) {
        //     this.device.exitPresent()
        // } else {
        //     this.device.requestPresent([{source: this.renderer.domElement}]);
        // }
    }

}
