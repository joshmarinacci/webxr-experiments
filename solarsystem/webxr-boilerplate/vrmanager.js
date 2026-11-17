function printError(err) {
    console.log(err)
}

export const VR_DETECTED = "detected"
export const VR_CONNECTED = "connected"
export const VR_DISCONNECTED = "disconnected"
export const VR_PRESENTCHANGE = "presentchange"
export const VR_ACTIVATED = "activated"



export default class VRManager {
    constructor(renderer) {
        this.device = null
        this.session = null
        this.renderer = renderer
        if(!this.renderer) throw new Error("VR Manager requires a valid ThreeJS renderer instance")
        this.listeners = {}

        if ('xr' in navigator && this.renderer.xr && typeof navigator.xr.isSessionSupported === 'function') {
            console.log("has webxr")
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    this.device = { isWebXR: true }
                    this.fire(VR_DETECTED,{})
                }
            }).catch(printError)
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
                this.fire(VR_PRESENTCHANGE)
            }, false );

            window.addEventListener( 'vrdisplayactivate',  ( event ) => {
                this.device = event.display
                this.device.requestPresent([{source:this.renderer.domElement}])
                this.fire(VR_ACTIVATED)
            }, false );

            navigator.getVRDisplays()
                .then( ( displays ) => {
                    console.log("vr scanned")
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
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(evt))
    }

    enterVR() {
        if (this.renderer.xr && 'xr' in navigator) {
            if (this.session) {
                this.session.end()
                return
            }

            navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
            }).then((session) => {
                session.addEventListener('end', () => {
                    this.session = null
                    this.fire(VR_PRESENTCHANGE, {isPresenting: false})
                })
                return this.renderer.xr.setSession(session).then(() => {
                    this.session = session
                    this.fire(VR_PRESENTCHANGE, {isPresenting: true})
                })
            }).catch(printError)
            return
        }

        if(!this.device) {
            console.warn("tried to connect VR on an invalid device")
            return
        }
        console.log("entering VR")
        const prom = this.renderer.xr.setDevice( this.device );
        console.log('promise is',prom)

        if(this.device.isPresenting) {
            this.device.exitPresent()
        } else {
            this.device.requestPresent([{source: this.renderer.domElement}]);
        }
    }

}
