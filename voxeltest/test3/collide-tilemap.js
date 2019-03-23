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

    offset = [-1,-1,-1]
    dimensions = [2,2,2]

    field = typeof field === 'function' ? field : function(x, y, z) {
        return this[x + y * dimensions[1] + (z * dimensions[1] * dimensions[2])]
    }.bind(field)

    var coords

    coords = [0, 0, 0]

    console.log("set it",offset,dimensions)
    return collide

    function collide(box, vec, oncollision) {

        // console.log('colliding',vec)
        // collide x, then y - if vector has a nonzero component
        // collideaxis(0)
        collideaxis(1)
        // collideaxis(2)

        //check for colision on the specified axis
        function collideaxis(i_axis) {
            var j_axis = (i_axis + 1) % 3
                , k_axis = (i_axis + 2) % 3
                , posi = vec[i_axis] > 0
            // console.log('main axis is',i_axis, 'others are',j_axis, k_axis)
            // console.log("vector is",vec,'positive is',posi)
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
            console.log('leading is', leading)

            // console.log('leading',leading)
            // loop from the current tile coord to the dest tile coord
            //    -> loop on the opposite axis to get the other candidates
            //      -> if `oncollision` return `true` we've hit something and
            //         should break out of the loops entirely.
            //         NB: `oncollision` is where the client gets the chance
            //         to modify the `vec` in-flight.
            // once we're done translate the box to the vec results

            function doTrans() {
                coords[0] = coords[1] = coords[2] = 0
                coords[i_axis] = vec[i_axis]
                // console.log('move',coords)
                box.translate(new Vector3(coords[0],coords[1],coords[2]))
            }

            var step = 0
            console.log('loop', iname, i_start, i_end, j_start, j_end, k_start, k_end, offset, dimensions, dir, posi)
            for(var i = i_start; i !== i_end; ++step, i += dir) {
                // console.log('c1',i)
                if(i < offset[i_axis] || i >= dimensions[i_axis]) {
                    // console.log('early1', i, offset[i_axis], dimensions[i_axis])
                    continue
                }
                for(var j = j_start; j !== j_end; ++j) {
                    // console.log('  c2',j)
                    if(j < offset[j_axis] || j >= dimensions[j_axis]) {
                        // console.log('early2')
                        continue
                    }
                    for(var k = k_start; k !== k_end; ++k) {
                        // console.log('   c3',i,j,k)
                        if(k < offset[k_axis] || k >= dimensions[k_axis]) {
                            // console.log('early3')
                            continue
                        }
                        // console.log('inside')
                        coords[i_axis] = i
                        coords[j_axis] = j
                        coords[k_axis] = k
                        tile = field.apply(field, coords)

                        if(tile === undefined) continue
                        console.log(i)
                        edge = dir > 0 ? i * tilesize : (i + 1) * tilesize
                        console.log(edge)
                        edge_vector = edge - leading
                        console.log(edge_vector)

                        if(oncollision(i_axis, tile, coords, dir, edge_vector)) {
                            // done = true
                            // break
                            return doTrans()
                        }
                    }
                }
            }

            return;// doTrans()
        }
    }
}
