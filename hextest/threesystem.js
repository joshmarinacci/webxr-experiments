import {
    BackSide,
    BoxGeometry,
    CanvasTexture,
    CylinderGeometry,
    DefaultLoadingManager,
    DoubleSide,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    MeshStandardMaterial,
    Object3D,
    PerspectiveCamera,
    PlaneGeometry,
    RepeatWrapping,
    Scene,
    SphereGeometry,
    TextureLoader,
    Vector3,
    WebGLRenderer
} from "./node_modules/three/build/three.module.js"
import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {WEBVR} from "./node_modules/three/examples/jsm/vr/WebVR.js"

export class ThreeCore {
    constructor() {
        this.scene = null
        this.camera = null
        this.renderer = null
        this.stage = null
        this.initialized = false
        this.canvas = null
    }

    getCanvas() {
        if(!this.canvas) throw new Error("canvas not initialized")
        return this.canvas
    }
}


export class ThreeSystem extends System {
    execute(delta,time) {
        this.queries.three.results.forEach(ent => this.setupThree(ent))
    }
    setupThree(ent) {
        const app = ent.getMutableComponent(ThreeCore)
        if(app.initialized) return
        const container = document.createElement( 'div' );
        document.body.appendChild( container );
        app.scene = new Scene();
        app.camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
        app.renderer = new WebGLRenderer( { antialias: true } );
        app.renderer.setPixelRatio( window.devicePixelRatio );
        app.renderer.setSize( window.innerWidth, window.innerHeight );
        app.renderer.gammaOutput = true
        app.renderer.vr.enabled = true;
        container.appendChild( app.renderer.domElement );
        app.canvas = app.renderer.domElement

        window.addEventListener( 'resize', ()=>{
            app.camera.aspect = window.innerWidth / window.innerHeight;
            app.camera.updateProjectionMatrix();
            app.renderer.setSize( window.innerWidth, window.innerHeight );
        }, false );
        app.initialized = true
        document.body.appendChild(WEBVR.createButton(app.renderer))
    }

    render(ent) {

    }
}

ThreeSystem.queries = {
    three: {
        components:[ThreeCore]
    }
}
