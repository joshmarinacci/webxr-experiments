import {Mesh, BoxBufferGeometry,
    MeshLambertMaterial, Color, DirectionalLight,
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    DefaultLoadingManager,
} from "./node_modules/three/build/three.module.js"

import VRManager, {VR_DETECTED} from "./VRManager.js";

export default class WebXRBoilerPlate {
    constructor(options) {
        this.listeners = {}
        this.container = options.container
        this.resizeOnNextRepaint = false
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }

    init() {
        //create DIV for the canvas
        // const container = document.createElement( 'div' );
        // document.body.appendChild( container );
        this.scene = new Scene();
        console.log('container size', this.container.clientWidth)
        this.camera = new PerspectiveCamera(70, this.container.clientWidth / this.container.clientHeight, 0.1, 50);
        this.renderer = new WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.gammaOutput = true
        this.renderer.vr.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        this.vrmanager = new VRManager(this.renderer)
        this.vrmanager.addEventListener(VR_DETECTED,()=>{
            if(this.listeners.detected) this.listeners.detected.forEach(cb => cb(this))
        })
        // document.body.appendChild( WEBVR.createButton( renderer ) );

        // initContent(scene,camera,renderer)

        DefaultLoadingManager.onStart = (url, loaded, total) => {
            console.log(`loading ${url}.  loaded ${loaded} of ${total}`)
        }
        DefaultLoadingManager.onLoad = () => {
            console.log(`loading complete`)
            // $("#loading-indicator").style.display = 'none'
            // $("#enter-button").style.display = 'block'
            // $("#enter-button").removeAttribute('disabled')
            if (this.listeners.loaded) this.listeners.loaded.forEach(cb => cb(this))
        }
        DefaultLoadingManager.onProgress = (url, loaded, total) => {
            console.log(`prog ${url}.  loaded ${loaded} of ${total}`)
            if(this.listeners.progress) this.listeners.progress.forEach(cb => cb(loaded/total))
            // $("#progress").setAttribute('value',100*(loaded/total))
        }
        DefaultLoadingManager.onError = (url) => {
            console.log(`error loading ${url}`)
        }

        this.lastSize = { width: 0, height: 0}
        this.render = (time) => {
            if (this.onRenderCb) this.onRenderCb(time,this)
            this.checkContainerSize()
            this.renderer.render(this.scene, this.camera);
        }

        this.renderer.setAnimationLoop(this.render)

        return new Promise((res, rej) => {
            res(this)
        })
    }


    onRender(cb) {
        this.onRenderCb = cb
    }

    enterVR() {
        this.vrmanager.enterVR()
    }

    playFullscreen() {
        console.log("entering full screen")
        this.resizeOnNextRepaint = true
        this.container.requestFullscreen()
    }

    checkContainerSize() {
        if(this.lastSize.width !== this.container.clientWidth || this.lastSize.height !== this.container.clientHeight) {
            this.lastSize.width = this.container.clientWidth
            this.lastSize.height = this.container.clientHeight
            this.camera.aspect = this.lastSize.width / this.lastSize.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.lastSize.width, this.lastSize.height);
        }
    }
}
