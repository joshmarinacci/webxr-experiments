# notes on voxel.js set of modules

Original collaborators.

* [Max Ogden](https://github.com/maxogden)
* [Substack / James Halliday](https://github.com/substack)
* [deathcap](https://github.com/deathcap)


## Essential

The [voxel](https://github.com/maxogden/voxel) repo.  works with voxel data structures

* voxel.generate produces various shaped worlds like spheres and valleys
* voxel.meshers  has various mesher functions. I *think* these convert voxel data structures to ThreeJS meshes
* voxel.generator more functions to produce voxel structures. based on http://mikolalysenko.github.io/MinecraftMeshes2/
* new voxel() creates a voxel data structure

   
The [voxel-engine](https://github.com/maxogden/voxel-engine) repo. binds the other code into a Game object so you
can build a real game out of it. The Game object has functions for

* get camera position
* add and remove items
* make something physical (I assume this means add physics to something?)
* create, set, remove blocks
* get the player position
* manage collisions
* add lights
* chunk loading, I'm guessing the world can be incrementally loaded into memory?
* tells the view to render I think?

* [voxel-mesh](https://github.com/maxogden/voxel-mesh) generates a threejs mesh from voxel data

* [voxel-view](https://github.com/maxogden/voxel-view) view functionality. I think this
 

## Non-essential



* [voxel-hello-world](https://github.com/maxogden/voxel-hello-world)  demo app using the engine
* [voxel-perlin-terrain](https://github.com/maxogden/voxel-perlin-terrain) generate terrain with perlin noise.
* [voxel-server](https://github.com/maxogden/voxel-server)  server for a multi player game
* [voxel-client](https://github.com/maxogden/voxel-client) client for the game server
* [voxel-builder](https://github.com/maxogden/voxel-builder) builder program to export to papercraft or 3d printing. http://voxelbuilder.com/
* [minecraft-chunk](https://github.com/maxogden/minecraft-chunk) read voxel data from minecraft chunks. I assume this and it's related modules let you import levels/maps from minecraft.
* [voxel-highlight](https://github.com/maxogden/voxel-highlight) highlight the voxel the player is currently looking at, along with adjacent area when control key is down. looking at the [code](https://github.com/maxogden/voxel-highlight/blob/master/index.js) it appears to create a ThreeJS wireframe mesh of a cube. On every game tick it calls game.raycastVoxels() to find what voxels are under the cursor / in front of the camera, then moves the highlight mesh around to match that.
* [voxel-2d-print](https://github.com/maxogden/voxel-2d-print) prints voxels to a color 2d printer
* [ndarray-stl](https://github.com/maxogden/ndarray-stl) convert voxels into 3d printable STL files

voxel-critter, voxel-creature, ways of creating little creatures that move around in voxel space

* [voxel-simplex-terrain](https://github.com/maxogden/voxel-simplex-terrain) generate terrain with simplex noise
* [voxel-world-function](https://github.com/maxogden/voxel-world-function) make a function to build a voxel world. ???
* [voxel-script-gun](https://github.com/maxogden/voxel-script-gun) player editable scripting UI for first person voxel editing ??
* [png-heightmap](https://github.com/maxogden/png-heightmap) PNG to voxel heightmap 
* [voxel-crunch](https://github.com/maxogden/voxel-crunch) RLE + Gzip compression for voxel chunks
* [voxel-player](https://github.com/maxogden/voxel-player) create a skinnable voxel player with physics enabled
* [voxel-region-change](https://github.com/maxogden/voxel-region-change) be alerted when player changes voxels or chunks.
* [rle-voxeljs](https://github.com/maxogden/rle-voxeljs) convert RLE volumes to Voxeljs. ??? 
* [voxel-mobs](https://github.com/maxogden/voxel-mobs) 3D JSON voxel data for various voxel creatures.
* [voxel-transforms](https://github.com/maxogden/voxel-transforms) transformation functions for voxel regions. erase, overlay, replace, move, walls.
* [voxel-share](https://github.com/maxogden/voxel-share) take a snapshot inside voxeljs and share to imgur/twitter
* [voxel-stop-motion](https://github.com/maxogden/voxel-stop-motion) animated gif export
* [voxel-control](https://github.com/maxogden/voxel-control) manipulate voxel physical objects
* [voxel-walk](https://github.com/maxogden/voxel-walk) basic walk cycle animation for characters
* [voxel-oculus](https://github.com/maxogden/voxel-oculus) stereo output view
* [voxel-fly](https://github.com/maxogden/voxel-fly) flying behavior




## engine description

I think this is basically how it works.  The world is stored in a voxel specific data structure. It is divided
into chunks.  When chunks come into view a mesher is used to convert the chunk into a ThreeJS compatible mesh, then
added to the ThreeJS scene. When a chunk goes out of view it is removed.  The voxel data structure can be
modified at runtime by setting and removing blocks, then the meshes must be updated to match.  Everything else is typical 
game dev stuff (movement, animation, audio, etc.)

Open questions

* is the voxel data structure and chunk/mesh management documented anywhere.  
* what is causing the massive memory usage that seems to grow over time.
* would it be possible to update to the latest ThreeJS?
* would it be faster if we switch to WebGL 2?
* in theory this should *just work* inside of WebVR. Has anyone tried it.


Currently VoxelJS
