import {makeEnum} from './common'
import {COLORS} from './gfx'

export const TERRAINS = makeEnum('GRASS','DIRT','WATER')

const TERRAIN_TO_COLOR = {}
TERRAIN_TO_COLOR[TERRAINS.GRASS]=COLORS.GREEN
TERRAIN_TO_COLOR[TERRAINS.DIRT]=COLORS.BROWN
TERRAIN_TO_COLOR[TERRAINS.WATER]=COLORS.TURQUOISE

export function terrainToColor(terrain) {
    if(TERRAIN_TO_COLOR[terrain]) return TERRAIN_TO_COLOR[terrain]
    return COLORS.RED
}



