import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {
    BoxGeometry,
    ConeGeometry,
    CylinderBufferGeometry,
    CylinderGeometry,
    Geometry,
    Group,
    Mesh,
    MeshLambertMaterial,
    VertexColors
} from "./node_modules/three/build/three.module.js"
import {pointy_hex_to_pixel, toRad} from './hex.js'
import {terrainToColor, terrainToHeight} from './globals.js'
import {COLORS} from "./gfx.js"
import {ForestTile} from './logic2.js'

export class Highlighted {

}


export class HexMapView {
    constructor() {
        this.started = false
        this.size = 2
        this.map = null
    }
}

export function makeTree(ent, size) {
    const tile = ent.getComponent(HexTileGroup)
    const forest = ent.getComponent(ForestTile)
    const center = pointy_hex_to_pixel(tile.hex,size)
    const h = terrainToHeight(tile.data.terrain)

    const geo = new Geometry()
    if(forest.treeLevel >= 3) {
        const level1 = new ConeGeometry(1.5, 2, 8)
        level1.faces.forEach(f => f.color.set(COLORS.GREEN))
        level1.translate(0, 4, 0)
        geo.merge(level1)
    }
    if(forest.treeLevel >= 2) {
        const level2 = new ConeGeometry(2,2,8)
        level2.faces.forEach(f => f.color.set(COLORS.GREEN))
        level2.translate(0,3,0)
        geo.merge(level2)
    }
    if(forest.treeLevel >= 1) {
        const level3 = new ConeGeometry(3, 2, 8)
        level3.faces.forEach(f => f.color.set(COLORS.GREEN))
        level3.translate(0, 2, 0)
        geo.merge(level3)
    }

    const trunk = new CylinderGeometry(0.5,0.5,2)
    trunk.faces.forEach(f => f.color.set(COLORS.BROWN))
    trunk.translate(0,0,0)
    geo.merge(trunk)

    const material = new MeshLambertMaterial({vertexColors: VertexColors})
    const obj = new Mesh(geo,material)
    obj.userData.level = forest.treeLevel
    obj.position.x = center.x*1.05
    obj.position.z = center.y*1.05
    obj.position.y = h/2 + 1
    return obj
}

export function makeHouse(data) {
    const geo = new Geometry()
    const sides = new BoxGeometry(1,1,1)
    sides.faces.forEach(f => f.color.set(COLORS.RED))
    sides.translate(0,0.5,0)
    sides.rotateY(toRad(45))
    geo.merge(sides)

    const top = new ConeGeometry(1.2,1.0,8)
    top.faces.forEach(f => f.color.set(COLORS.DARK_BROWN))
    top.translate(0,1.5,0,)
    geo.merge(top)

    const material = new MeshLambertMaterial({vertexColors: VertexColors})
    const obj = new Mesh(geo,material)
    obj.position.y = 0
    return obj
}

class HexTileGroup {
    constructor() {
        this.threeNode = null
        this.hex = null
    }
}


export class HexSystem extends System {
    execute(delta,time) {
        this.queries.maps.results.forEach(ent => {
            const map = ent.getMutableComponent(HexMapView)
            if(!map.started) this.initMapView(map)
        })
        this.queries.highlighted.added.forEach(ent => {
            ent.getMutableComponent(HexTileGroup).threeNode.material.color.set('red')
        })
        this.queries.highlighted.removed.forEach(ent => {
            const node = ent.getMutableComponent(HexTileGroup).threeNode
            node.material.color.set(node.userData.regularColor)
        })
        this.queries.forest.added.forEach(ent => {
            const tile = ent.getMutableComponent(HexTileGroup)
            const forest = ent.getComponent(ForestTile)
            tile.treeNode =  makeTree(ent,2)
            tile.treeNodeLevel = forest.treeLevel
            tile.threeNode.add(tile.treeNode)
        })
        this.queries.forest.results.forEach(ent => {
            const tile = ent.getComponent(HexTileGroup)
            const forest = ent.getComponent(ForestTile)
            if(tile.treeNodeLevel !== forest.treeLevel) {
                tile.threeNode.remove(tile.treeNode)
                tile.treeNode = makeTree(ent,2)
                tile.treeNodeLevel = forest.treeLevel
                tile.threeNode.add(tile.treeNode)
            }
        })
    }

    initMapView(view) {
        view.started = true
        view.threeNode = new Group()
        view.map.forEachPair((hex,data)=>{
            const center = pointy_hex_to_pixel(hex,view.size)
            const h = terrainToHeight(data.terrain)
            const hexView = new Mesh(
                new CylinderBufferGeometry(view.size,view.size,h,6),
                new MeshLambertMaterial({color:terrainToColor(data.terrain)})
            )
            view.threeNode.add(hexView)
            hexView.position.x = center.x*1.05
            hexView.position.z = center.y*1.05
            hexView.position.y = h/2
            hexView.userData.hex = hex
            hexView.userData.data = data
            hexView.userData.regularColor = terrainToColor(data.terrain)
            data.ent.addComponent(HexTileGroup, {threeNode:hexView, hex:hex,data:data})
        })
    }
}

HexSystem.queries = {
    maps: {
        components:[HexMapView]
    },
    highlighted: {
        components: [Highlighted],
        listen: {
            added:true,
            removed:true,
        }
    },
    forest: {
        components: [ForestTile, HexTileGroup],
        listen: {
            added:true,
            removed:true,
        }
    }
}

