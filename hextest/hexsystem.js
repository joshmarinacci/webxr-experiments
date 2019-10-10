import {System} from "./node_modules/ecsy/build/ecsy.module.js"
import {Mesh, MeshBasicMaterial, MeshLambertMaterial,
    SphereBufferGeometry,
    CylinderBufferGeometry,
    Group,
}  from "./node_modules/three/build/three.module.js"
import {pointy_hex_to_pixel} from './hex'
import {terrainToColor} from './globals.js'
import {terrainToHeight} from './globals.js'


export class HexMapView {
    constructor() {
        this.started = false
        this.size = 2
    }
}


export class HexSystem extends System {
    execute(delta,time) {
        this.queries.maps.results.forEach(ent => {
            const map = ent.getMutableComponent(HexMapView)
            if(!map.started) this.initMapView(map)
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
        })
        view.threeNode.position.z = -40
        view.threeNode.position.x = -4
        view.threeNode.position.y = -10
        view.threeNode.rotation.x += 0.3
    }
}

HexSystem.queries = {
    maps: {
        components:[HexMapView]
    }
}

