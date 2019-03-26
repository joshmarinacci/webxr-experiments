import {POINTER_CLICK} from './Pointer.js'
import {Object3D, Vector2, CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry} from "./node_modules/three/build/three.module.js"
import Panel2D from "./node_modules/threejs-2d-components/src/panel2d.js"
import Label2D from "./node_modules/threejs-2d-components/src/label2d.js"
import Button2D from "./node_modules/threejs-2d-components/src/button2d.js"


const on = (elem, type, cb) => elem.addEventListener(type,cb)

export class BlockPicker {
    constructor(app) {
        this.app = app
        this.panel = new Panel2D(app.scene,app.camera, {
            draggable: false,
            width: 256,
            height: 256,
        })
        // this.type = 'panel2d'
        /*
        this.canvas = document.createElement('canvas')
        this.canvas.width = 512
        this.canvas.height = 512
        this.canvasTexture = new CanvasTexture(this.canvas)
        this.mesh = new Mesh(
            new PlaneGeometry(1,1),
            new MeshBasicMaterial({color:'white',map:this.canvasTexture})
        )
        this.mesh.userData.clickable = true
        this.add(this.mesh)
        */
        this.app.scene.add(this.panel)


        this.selectedColor = 'none'
        // this.redraw()

        /*
        on(this.mesh,POINTER_CLICK,(e)=>{
            const uv = e.intersection.uv
            const w = this.canvas.width
            const h = this.canvas.height
            const fpt = new Vector2(uv.x*w, h-uv.y*h).divideScalar(64).floor()
            const index = fpt.y*4 + fpt.x
            if(fpt.y >= 3) {
                this.visible = false
                return
            }

            const infos = this.app.textureManager.getAtlasIndex()
            if(infos[index]) {
                this.selectedColor = infos[index].name
            } else {
                console.log("nothing selected")
            }
            this.redraw()
        })
        */

    }

    rebuild() {
        this.panel.removeAll()
        this.panel.add(new Label2D().set('text','block type').set('x',20).set('y',0))
        const index = this.app.textureManager.getAtlasIndex()
        index.forEach((info,i) => {
            const button = new Button2D().setAll({
                text:info.name,
                x:(i%4)*70+10,
                y:Math.floor(i/4)*40+40,
                w:40,
                h:40,
            },info.name)
            on(button,'click',()=>{
                console.log("selected block", info.name)
                const infos = this.app.textureManager.getAtlasIndex()
                if(infos[i]) {
                    this.selectedColor = infos[i].name
                } else {
                    console.log("nothing selected")
                }
            })
            this.panel.add(button)
        })

        this.panel.add(new Button2D().setAll({
            text:this.app.active?'creative':'active',
            x:10,
            y:225,
            w:40,
            h:40,
        }).on('click',()=>{
            console.log('toggling creative mode')
            this.app.active = !this.app.active
            this.app.player_phys.endFlying()
            this.panel.visible = false
        }))
        this.panel.add(new Button2D().setAll({
            text:'close',
            x: 190,
            y: 225,
        }).on('click',()=>{
            this.panel.visible = false
        }))
    }

    setSelectedToDefault() {
        const index = this.app.textureManager.getAtlasIndex()
        this.selectedColor = index[0].name
    }
    /*
    redraw() {
        const ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'white'
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
        const index = this.app.textureManager.getAtlasIndex()
        index.forEach((info,i) => {
            const x = (i%4)*64
            const y = Math.floor((i/4))*64
            ctx.fillStyle = 'red'
            ctx.fillRect(x,y,64,64)
            ctx.drawImage(this.app.textureManager.canvas,
                info.x,info.y,info.w,info.h,
                x,y,64,64
            )

            if(this.selectedColor === info.name) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'black'
                ctx.strokeRect(x+2,y+2,64-4,64-4)
                ctx.strokeStyle = 'white'
                ctx.strokeRect(x+4,y+4,64-8,64-8)
            }
        })

        ctx.fillStyle = 'black'
        ctx.fillRect(0,256-64,64*4,64)
        ctx.fillStyle = 'white'
        ctx.font = '32px sans-serif';
        ctx.fillText('close',32,256-64+32)
        this.canvasTexture.needsUpdate = true
    }
    */
}
