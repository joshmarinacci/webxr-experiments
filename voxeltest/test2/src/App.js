import React, { Component } from 'react';
import './App.css';

// var voxel = require('voxel')
var createGame = require('voxel-engine')
var player = require('voxel-player')
// var fly = require('voxel-fly')
// var walk = require('voxel-walk')
// var highlight = require('voxel-highlight')

const valley =function(i,j,k) {
    return j <= (i*i + k*k) * 31 / (32*32*2) + 1 ? 1 + (1<<15) : 0;
}

class App extends Component {
  componentDidMount() {
    var defaults = {
      generate: valley,
      chunkDistance: 2,
      materials: ['#fff000', '#000'],
      materialFlatColor: true,
      worldOrigin: [0, 0, 0],
      controls: { discreteFire: true }
    }
    var game = createGame(defaults)
    console.log("made the game",game)
    var container = document.body
    window.game = game // for debugging
    game.appendTo(container)
    if (game.notCapable()) {
      console.log("not capable")
      return game
    }
    console.log("is capable")
    var createPlayer = player(game)
    var avatar = createPlayer('player.png')
    avatar.possess()
    avatar.yaw.position.set(2, 14, 4)
    defaultSetup(game, avatar)

  }
  render() {
    return (
      <div>

      </div>
    );
  }
}


function defaultSetup(game, avatar) {

  // var makeFly = fly(game)
  // var target = game.controls.target()
  // game.flyer = makeFly(target)

  // highlight blocks when you look at them, hold <Ctrl> for block placement
  // var blockPosPlace, blockPosErase
  // var hl = game.highlighter = highlight(game, { color: 0xff0000 })
  // hl.on('highlight', function (voxelPos) { blockPosErase = voxelPos })
  // hl.on('remove', function (voxelPos) { blockPosErase = null })
  // hl.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos })
  // hl.on('remove-adjacent', function (voxelPos) { blockPosPlace = null })

  // toggle between first and third person modes
  // window.addEventListener('keydown', function (ev) {
  //   if (ev.keyCode === 'R'.charCodeAt(0)) avatar.toggle()
  // })

  // block interaction stuff, uses highlight data
  // var currentMaterial = 1

  /*
  game.on('fire', function (target, state) {
    var position = blockPosPlace
    if (position) {
      game.createBlock(position, currentMaterial)
    }
    else {
      position = blockPosErase
      if (position) game.setBlock(position, 0)
    }
  })

  game.on('tick', function() {
    walk.render(target.playerSkin)
    var vx = Math.abs(target.velocity.x)
    var vz = Math.abs(target.velocity.z)
    if (vx > 0.001 || vz > 0.001) walk.stopWalking()
    else walk.startWalking()
  })
*/
}

export default App;
