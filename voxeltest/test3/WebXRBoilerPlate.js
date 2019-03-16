import {DefaultLoadingManager, PerspectiveCamera, Scene, WebGLRenderer,} from "./node_modules/three/build/three.module.js"

import VRManager, {VR_DETECTED} from "./vrmanager.js";

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
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(70, this.container.clientWidth / this.container.clientHeight, 0.1, 100);
        this.renderer = new WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.gammaOutput = true
        this.renderer.vr.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        this.vrmanager = new VRManager(this.renderer)
        this.vrmanager.addEventListener(VR_DETECTED, ()=>{
            if(this.listeners[VR_DETECTED]) this.listeners[VR_DETECTED].forEach(cb => cb(this))
        })

        this.loadingManager = DefaultLoadingManager

        DefaultLoadingManager.joshtest = true
        DefaultLoadingManager.onStart = (url, loaded, total) => {
            console.log(`XR: loading ${url}.  loaded ${loaded} of ${total}`)
        }
        DefaultLoadingManager.onLoad = () => {
            console.log(`XR: loading complete`)
            if (this.listeners.loaded) this.listeners.loaded.forEach(cb => cb(this))
        }
        DefaultLoadingManager.onProgress = (url, loaded, total) => {
            console.log(`XR: prog ${url}.  loaded ${loaded} of ${total}`)
            if(this.listeners.progress) this.listeners.progress.forEach(cb => cb(loaded/total))
        }
        DefaultLoadingManager.onError = (url) => {
            console.log(`XR: error loading ${url}`)
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
        this.resizeOnNextRepaint = true
        const el = this.renderer.domElement
        if(el.requestFullscreen) return el.requestFullscreen()
        if(el.webkitRequestFullscreen) return el.webkitRequestFullscreen()
    }

    exitFullscreen() {
        this.resizeOnNextRepaint = true
        if(document.fullscreenElement) {
            document.exitFullscreen().then(() => {
                console.log('exited fullscreen')
            }).catch(e => {
                console.log("error with fullscreen exit. already exited?")
            })
        }
    }

    checkContainerSize() {
        let el = this.renderer.domElement
        if(this.resizeOnNextRepaint || this.lastSize.width !== el.clientWidth || this.lastSize.height !== el.clientHeight) {
            if(document.fullscreenElement) {
                //inside fullscreen
            }  else {
                //outside fullscreen
                el = this.container
            }
            this.lastSize.width = el.clientWidth
            this.lastSize.height = el.clientHeight
            this.camera.aspect = this.lastSize.width / this.lastSize.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.lastSize.width, this.lastSize.height);
        }
        this.resizeOnNextRepaint = false
    }
}
