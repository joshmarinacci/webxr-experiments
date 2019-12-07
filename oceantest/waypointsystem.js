import {Vector3} from "https://threejs.org/build/three.module.js"
import {System} from "https://ecsy.io/build/ecsy.module.js"
import {Position, ThreeObject} from '../josh_common_ecsy/index.js'

const randf = (min,max) => Math.random()*(max-min) + min

export class Waypoint {
}

export class WaypointFollower {
    constructor() {
        this.targetWaypoint = null
        this.speed = 0.03
        this.moving = false
    }
}

export class WaypointSystem extends System {
    execute() {
        this.queries.followers.added.forEach(ent => {
            const follower = ent.getComponent(WaypointFollower)
            follower.speed = randf(0.01,0.04)
            this.startFollower(ent,this.findWaypoint())
        })
        this.queries.followers.results.forEach(ent => {
            const follower = ent.getComponent(WaypointFollower)
            const obj = ent.getComponent(ThreeObject)
            const temp = new Vector3()
            temp.copy(obj.mesh.position)
            temp.sub(follower.targetWaypoint.getComponent(Position))
            if(temp.length() < 0.25) {
                this.startFollower(ent,this.findWaypoint())
            } else {
                let temp2 = new Vector3()
                temp2.copy(follower.direction)
                temp2.multiplyScalar(-follower.speed)
                obj.mesh.position.add(temp2)
            }
        })
    }

    findWaypoint() {
        let i = Math.floor(Math.random()*this.queries.waypoints.results.length)
        return this.queries.waypoints.results[i]
    }

    startFollower(ent, wp) {
        const follower = ent.getComponent(WaypointFollower)
        const obj = ent.getComponent(ThreeObject)
        follower.targetWaypoint = wp
        follower.direction = new Vector3()
        follower.direction.copy(obj.mesh.position)
        const wppos = new Vector3()
        wppos.copy(follower.targetWaypoint.getComponent(Position))
        follower.direction.sub(wppos)
        follower.direction.normalize()
        obj.mesh.lookAt(wppos)
        follower.moving = true
    }
}
WaypointSystem.queries = {
    followers: {
        components:[WaypointFollower,ThreeObject],
        listen: {
            added:true
        }
    },
    waypoints: {
        components: [Waypoint,Position]
    }
}
