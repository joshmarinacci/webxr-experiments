import {CanvasTexture, RepeatWrapping, TextureLoader} from "https://threejs.org/build/three.module.js"
import {
    FloatNode,
    MathNode,
    OperatorNode,
    StandardNodeMaterial,
    TextureNode,
    UVNode,
} from "https://threejs.org/examples/jsm/nodes/Nodes.js"
import {World} from "https://ecsy.io/build/ecsy.module.js"
import {
    CustomNodeMaterialSystem,
    GLTFModel,
    GLTFModelSystem,
    oneWorldTick,
    Position,
    startWorldLoop,
    ThreeCore,
    ThreeObjectManager,
    ThreeSystem
} from '../josh_common_ecsy/index.js'

import {AmbientLight, findChildMeshes} from '../josh_common_ecsy/ThreeObjectManager.js'
import {OrbitalControls} from '../josh_common_ecsy/threesystem.js'

const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => document.querySelectorAll(sel)
const on = (elem, type, cb) => elem.addEventListener(type,cb)

$("#debug p").innerText = `loading = ${document.location}`

let colorTex =new TextureLoader().load("IMG_0517.jpg")
let textureCanvas
let canvasSize = {
    w:64,
    h:64
}
let canvasOffset = {
    x:16,
    y:16,
}
let canvasScale = 4

const PALETTE = [
    '#000000',
    '#8f8e95',
    '#ffffff',
    '#da131b',
    '#3bc452',
    '#955100',
    '#16b7c8',
    '#276fff',
    '#ffda15',
]
let selectedColor = 1

class DataGrid {
    constructor(w,h) {
        this.w = w
        this.h = h
        this.data = []
        for(let i=0; i<w*h; i++) {
            this.data.push(2)
        }
    }
    getWidth() {
        return this.w
    }
    getHeight() {
        return this.h
    }
    getValue(x,y) {
        return this.data[y*this.w + x]
    }
    setValue(x,y,val) {
        this.data[y*this.w+x] = val
    }
    //this stores the indexed value in the red channel
    toDataURL() {
        const canvas = document.createElement('canvas')
        canvas.width = this.w
        canvas.height = this.h
        const ctx = canvas.getContext('2d')
        for(let x=0; x<this.w; x++) {
            for(let y =0; y<this.h; y++) {
                const v = this.getValue(x,y)
                ctx.fillStyle = `rgb(${v},${v},${v})`
                ctx.fillRect(x,y,1,1)
            }
        }
        return canvas.toDataURL('png')
    }

    fromDataURL(dataURL) {
        const img = new Image()
        img.onload = () => {
            console.log("loaded the image",img)
            const can = document.createElement('canvas')
            can.width = img.width
            can.height = img.height
            const c = can.getContext('2d')
            c.drawImage(img,0,0)
            const id = c.getImageData(0,0,can.width,can.height)
            for(let x=0; x<id.width; x++) {
                for(let y=0;y<id.height; y++) {
                    const n = (y*id.width+x)*4
                    const r = id.data[n+0]
                    this.setValue(x,y,r)
                }
            }
            drawCanvas()
            window.finished = true
            console.log("truly finished")
        }
        img.src = dataURL
    }
}
const data = new DataGrid(32,32)

function drawDataToCanvas(ctx, data, scale, offx, offy) {
    for(let j=0; j<data.getHeight(); j++) {
        for(let i=0; i<data.getWidth(); i++) {
            const color = data.getValue(i,j)
            ctx.fillStyle = PALETTE[color]
            ctx.fillRect(i*scale+offx,j*scale+offy,scale,scale)
        }
    }
}

function drawCanvas() {
    const canvas = $("#canvas")
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    let scale = Math.floor(w/data.getWidth())
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = 'green'
    ctx.fillRect(0,0,w,h)
    drawDataToCanvas(ctx,data,scale,0,0)
    if(textureCanvas){
        const c = textureCanvas.getContext('2d')
        c.save()
        c.scale(1,-1)
        c.translate(32+16,-canvasSize.h-64-64-16)
        c.imageSmoothingEnabled = false
        drawDataToCanvas(c,data,canvasScale,canvasOffset.x,canvasOffset.y)
        c.restore()
        colorTex.needsUpdate = true
    }
}


drawCanvas()
let mousePressed = false
on($('#canvas'),'mousedown',(e)=>{
    mousePressed = true
    setPixelFromMouse(e)
})

let count = 0
function updateURL() {
    count++
    const state = {
        count:count
    }
    const url = `./editor.html?count=${count}&data=${data.toDataURL()}`
    history.pushState(state,"",url)
}

on($('#canvas'),'mouseup',(e)=>{
    mousePressed = false
    updateURL()
})

function setPixelFromMouse(e) {
    const rect = e.target.getBoundingClientRect()
    const pt = {
        x:e.clientX - rect.left,
        y:e.clientY - rect.top
    }
    let scale = Math.floor(e.target.width / data.getWidth())
    pt.x = Math.floor(pt.x/scale)
    pt.y = Math.floor(pt.y/scale)
    data.setValue(pt.x,pt.y,selectedColor)
    drawCanvas()
}

on($('#canvas'),'mousemove',(e)=>{
    if(!mousePressed) return
    setPixelFromMouse(e)
})

function setupButtons() {
    PALETTE.forEach((color,index) => {
        const button = document.createElement('button')
        button.style.backgroundColor = color
        $("#buttons").appendChild(button)
        on(button,'click',()=> {
            $$("#buttons button").forEach(el => el.classList.remove('selected'))
            button.classList.add('selected')
            selectedColor = index
        })
    })
}
setupButtons()

const f = (val) => new FloatNode(val)
const add = (a,b) => new OperatorNode(a,b,OperatorNode.ADD)
const mul = (a,b) => new OperatorNode(a,b,OperatorNode.MUL)
const div = (a,b) => new OperatorNode(a,b,OperatorNode.DIV)
const floor = (a) => new MathNode(a,MathNode.FLOOR)

let sweaterMaterial

function generateTexture(core,world) {
    const canvas = document.createElement('canvas')
    canvas.width = canvasSize.w*canvasScale
    canvas.height = canvasSize.h*canvasScale
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = PALETTE[2]
    ctx.fillRect(0,0,canvas.width,canvas.height)
    textureCanvas = canvas
    drawDataToCanvas(ctx,data,canvasScale,canvasOffset.x,canvasOffset.y)
    colorTex = new CanvasTexture(canvas)
    // $("body").appendChild(canvas)
}
function setupNodeMaterial(core, world) {

    const material = new StandardNodeMaterial();

    const pxsize = 32*4
    const size = f(pxsize)
    //add  -0.25 to center it
    const pixelOff = f(1/pxsize/2-0.25)
    const patternTex =new TextureLoader().load("sweater.png")
    patternTex.wrapS = patternTex.wrapT = RepeatWrapping;
    colorTex.wrapS = colorTex.wrapT = RepeatWrapping;
    let uv2 = mul(new UVNode(),size)
    let uvColor = mul(add(div(floor(mul(new UVNode(),size)),size),pixelOff),f(2))

    material.color = mul(
        new TextureNode(patternTex,uv2),
        new TextureNode(colorTex,uvColor)
    )

    sweaterMaterial = material
}

function setupModel(core, world) {
    let model = world.createEntity()
    // model.addComponent(ThreeObject)
    model.addComponent(GLTFModel, {
        src:"sweater1.glb",
        scale: 5,
        recenter:true,
        onLoad:(obj)=>{
            findChildMeshes(obj).forEach(m => {
                m.material = sweaterMaterial
            })
        }})
    model.addComponent(Position,{x: 0, z:0, y:0})
}

function setup() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(ThreeObjectManager)
    world.registerSystem(CustomNodeMaterialSystem)
    world.registerSystem(GLTFModelSystem)

    let game = world.createEntity()
    game.addComponent(ThreeCore, {canvas: $("#viewer-canvas"), backgroundColor: '#f0f0f0'})
    game.addComponent(OrbitalControls, {min: 2, max: 5})
    game.addComponent(AmbientLight)

    $("#viewer-canvas").width = $("#viewer").offsetWidth
    $("#viewer-canvas").height = $("#viewer").offsetHeight

    oneWorldTick(game,world)
    const core = game.getMutableComponent(ThreeCore)
    generateTexture()
    setupNodeMaterial(core,world)
    setupModel(core,world)
    startWorldLoop(game,world)
}

setup()

function loadDoc() {
    const query = {}
    if(document.location.search.startsWith("?")) {
        document.location.search.substring(1).split("&").forEach(s => {
            const parts = s.split('=')
            query[parts[0]] = parts[1]
        })
    }
    if(query.count) count = query.count
    if(query.data) {
        data.fromDataURL(query.data)
    } else {
        console.log("quick finish")
        window.joshfinished = true
    }
    if(query.debug) {
    }
}

loadDoc()


on($("#share"),'click',()=>{
    $("#dialog").classList.toggle('hidden')
    $("#url").value = document.location.toString()
})
on($("#close"),'click',()=>{
    $("#dialog").classList.toggle('hidden')
})

