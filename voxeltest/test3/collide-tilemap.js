import {Vector3} from "./node_modules/three/build/three.module.js"

export const makeCollider = function(field, tilesize, dimensions, offset) {
    dimensions = dimensions || [
        Math.sqrt(field.length) >> 0
        , Math.sqrt(field.length) >> 0
        , Math.sqrt(field.length) >> 0
    ]

    offset = offset || [
        0
        , 0
        , 0
    ]

    field = typeof field === 'function' ? field : function(x, y, z) {
        return this[x + y * dimensions[1] + (z * dimensions[1] * dimensions[2])]
    }.bind(field)

    var coords

    coords = [0, 0, 0]

    return collide

    function collide(box, vec, oncollision) {

        // console.log('colliding',vec)
        // collide x, then y - if vector has a nonzero component
        if(vec[0] !== 0) collideaxis(0)
        if(vec[1] !== 0) collideaxis(1)
        if(vec[2] !== 0) collideaxis(2)

        function collideaxis(i_axis) {
            // console.log('doing axis',i_axis)
            var j_axis = (i_axis + 1) % 3
                , k_axis = (i_axis + 2) % 3
                , posi = vec[i_axis] > 0
            // console.log(box)
            const iname = i_axis===0?'x':i_axis===1?'y':'z'
            const jname = j_axis===0?'x':j_axis===1?'y':'z'
            const kname = k_axis===0?'x':k_axis===1?'y':'z'
            var leading = box[posi ? 'max' : 'base'][iname]
            var dir = posi ? 1 : -1
                , i_start = Math.floor(leading / tilesize)
                , i_end = (Math.floor((leading + vec[i_axis]) / tilesize)) + dir
                , j_start = Math.floor(box.base[jname] / tilesize)
                , j_end = Math.ceil(box.max[jname] / tilesize)
                , k_start = Math.floor(box.base[kname] / tilesize)
                , k_end = Math.ceil(box.max[kname] / tilesize)
                , done = false
                , edge_vector
                , edge
                , tile

            // console.log('leading',leading)
            // loop from the current tile coord to the dest tile coord
            //    -> loop on the opposite axis to get the other candidates
            //      -> if `oncollision` return `true` we've hit something and
            //         should break out of the loops entirely.
            //         NB: `oncollision` is where the client gets the chance
            //         to modify the `vec` in-flight.
            // once we're done translate the box to the vec results

            var step = 0
            for(var i = i_start; !done && i !== i_end; ++step, i += dir) {
                if(i < offset[i_axis] || i >= dimensions[i_axis]) continue
                for(var j = j_start; !done && j !== j_end; ++j) {
                    if(j < offset[j_axis] || j >= dimensions[j_axis]) continue
                    for(var k = k_start; k !== k_end; ++k) {
                        if(k < offset[k_axis] || k >= dimensions[k_axis]) continue
                        coords[i_axis] = i
                        coords[j_axis] = j
                        coords[k_axis] = k
                        tile = field.apply(field, coords)

                        if(tile === undefined) continue
                        // console.log(i)
                        edge = dir > 0 ? i * tilesize : (i + 1) * tilesize
                        // console.log(edge)
                        edge_vector = edge - leading
                        // console.log(edge_vector)

                        if(oncollision(i_axis, tile, coords, dir, edge_vector)) {
                            done = true
                            break
                        }
                    }
                }
            }

            coords[0] = coords[1] = coords[2] = 0
            coords[i_axis] = vec[i_axis]
            box.translate(new Vector3(coords[0],coords[1],coords[2]))
        }
    }
}
