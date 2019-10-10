import {makeEnum} from './common'
import {COLORS} from './gfx.js'

export const TERRAINS = makeEnum('GRASS','DIRT','WATER')

const TERRAIN_TO_COLOR = {}
TERRAIN_TO_COLOR[TERRAINS.GRASS]=COLORS.GREEN
TERRAIN_TO_COLOR[TERRAINS.DIRT]=COLORS.BROWN
TERRAIN_TO_COLOR[TERRAINS.WATER]=COLORS.TURQUOISE

const TERRAIN_TO_HEIGHT = {}
TERRAIN_TO_HEIGHT[TERRAINS.WATER] = 0.1
TERRAIN_TO_HEIGHT[TERRAINS.DIRT] = 0.5
TERRAIN_TO_HEIGHT[TERRAINS.GRASS] = 1.0

export function terrainToColor(terrain) {
    if(TERRAIN_TO_COLOR[terrain]) return TERRAIN_TO_COLOR[terrain]
    return COLORS.RED
}

export function terrainToHeight(terrain) {
    if(terrain in TERRAIN_TO_HEIGHT) return TERRAIN_TO_HEIGHT[terrain]
    return 0
}


