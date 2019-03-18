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
* [voxel-builder](https://github.com/maxogden/voxel-builder) builder program to export to papercraft or 3d 
  printing. http://voxelbuilder.com/
* [minecraft-chunk](https://github.com/maxogden/minecraft-chunk) read voxel data from minecraft chunks. 
  I assume this and it's related modules let you import levels/maps from minecraft.
* [voxel-highlight](https://github.com/maxogden/voxel-highlight) highlight the voxel the player is currently looking at, 
  along with adjacent area when control key is down. looking at 
  the [code](https://github.com/maxogden/voxel-highlight/blob/master/index.js) it appears to 
  create a ThreeJS wireframe mesh of a cube. On every game tick it calls game.raycastVoxels() to 
  find what voxels are under the cursor / in front of the camera, then moves the highlight mesh around to match that.
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
* [voxel-transforms](https://github.com/maxogden/voxel-transforms) transformation functions for voxel regions. 
  erase, overlay, replace, move, walls.
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


===========



design for navigation and interaction

In regular minecraft in full screen on desktop mode you are always interacting with 
whatever is in the center of the camera.  Press the right mouse button to create a 
block. press the left mouse button to smash a block. always you are interacting 
with the block in the center of the camera. there is a cross hairs to show you where 
you are pointing. for full screen mode on desktop I think this makes sense.

movement is done with the WASD keys. W and S move forward and backward in the 
direction of the camera. A and D move left and right, side stepping, again relative 
to the camera. to turn left or right you simply move the camera using the mouse. 
the camera is always controlled by the mouse.

the equivlant in VR could then be:  your head turns the camera and pressing 
the up and down keys move you in the direction of the camera, not in the direction 
of the pointer.  the same with left and right.    alternatively, they could be 
relative to the pointer, so you could point and move to the left while looking 
to the right. the only way to know is to test it out.

in VR interaction with blocks should definitely be by pointing at a block with 
the laser and using the trigger.  click to destroy. but what to use for placing 
new blocks, since we don't have a right click eqiuvalent. possiblities:

* hold and press trigger to break blocks
* can I capture the back button for a menu?
* repurpose the left and right buttons?


for moving forward we should press and hold the W or trigger buttons, 
instead of clicking to jump ahead. Will this be more disorienting than 
jumping one meter ahead per click?



=====================


autonomous entities (MOBs?)


an entity is an object with a threejs mesh (or possibly more). it is autonomous in the sense it has
it's own tick() and can calculate where it is and wants to be. It is in charge of it's own animation.

first example: Pig

* composed of a pink cube. 
* on each tick it applies gravity to ensure falling
* on each tick it moves forward on it's heading
* on each tick it checks if it has run into something. if so, pick a new random heading
* speed in the heading direction is constant


To start place it in a walled gate. Let the player take some gate walls down to let the pig run around.
Put a trench around the pig that it will fall into so it can't get too far.

``` javascript

class ECSComp {
    addEventListener()
    fire()
    update()
}

class Pig extends ECSComp {
    constructor() {
    }
    fire collide    
}

const comps = []

app.onUpdate(time) {
    comps.forEach(c => c.upudate(time))
}

const pig = new Pig()
pig.tick()  

```


================

---------------

texture mapping


the meshing process turns a chunk, containing voxel data, into a threejs mesh.  this mesh is composed of many right
triangles called Faces. the meshing process assigns UVs to these faces. Then the voxel-texture component (now called
voxelTexture) 'paints' the faces by setting new UVs which match the textures in a texture atlas.

This process fails for two reasons.  First, originally the texture system was for quads. With quads each face has 
four unique UV values. With triangle faces (3 vertices each) one of the UVs is shared. The meshing process handles
this, but the VoxelTexture component was written back in the quad era, so it doesn't work quite right. some UV
values will be written twice, meaning half of the faces will have a bad UV value. This explains why the cubes
always looked half wrong. I fixed this by calculating the UVs slightly differently for the even and odd faces. However
this was a hack. Fundamentally they are trying to set UVs once during meshing, and then a second time during painting,
but the painting process doesn't know about the meshing process and wasn't using the existing UV values, so any
attempt to do this will fail if the meshing process changes. Really they should be combined so that the texture
system just provides a texture atlas to the mesher, which then sets the correct UV valeus once.

There is a second problem, however.  Some meshers, like the greedy mesher, will use faces which are larger
than a one block square. If a bunch of blocks are next to each other and are of the same type, then the mesher
will create one giant block with very large faces. These faces will still only get one set of UV values, however, so
the texture will be stretched across it.  To solve this problem requires more thought. Possibly a custom shader.

  
 
----------------

the fundamental issue seems to be that a quad gets one set of UVs representing the index into the texture atlas
but the quad may be of any rectangular dimension and needs to repeat across those. The only way to solve
this is using a custom shader.  The new system should

* still load the textures into a single atlas and generate sub-texture UVs. 
  Could allow for dynamic updates too.
* animation is done by putting each frame in adjacent cells in the atlas so 
  we can just move the uvs for each frame.
* use the existing atlas class to do this. Load all of the sprites of an 
  animation as a single long rectangular unit.
* assume a constant animation speed
* assign the sub-texture UVs during the mesh generation process, since they are very 
  tightly coupled. Don’t ‘paint’ them afterwards.
* when meshing set vertex attributes for
	* if the face is animated
	* the frame count for animated
	* the wrap count
	* the side of the cube this represents?
* create a custom shader. The shader will
	* draw the texture
	* apply sub-texture wrapping based on a vertex attribute
	* chose animation frame based on a uniform and vertex attribute indicating if it is animated
	* apply ambient occlusion light based on vertex attribute
	* apply directional sunlight based on a passed in uniform
	* apply local light sources (are these per chunk? Passed in as uniforms? Vertex data?)


Implementation plan

* create texture manager as an app global. preload it with textures into the atlas. 
  method to get UVs for a particular blockid
* store blockid on the face info from the mesher
* new geometry maker. add vertex attributes for
    * animation frame count (set to 1 for now)
    * quad width and height in blocks
    * UV values into the atlas (should already be there as part of the faces?). get from texture manager.
    * ambient occlusion value (set to 0 for now)
    * color, used for flat shading now, for tinting textures later
* make a new custom shader. 
    * passthrough vertex shader
    * fragment shader uses vertex color
* support textures
    * fragment shader uses uv values and quad width and height values to texture the quad
* support animation
    * create an animated texture to test with (find some open source minecraft water or lava?)
    * load into texture atlas. track that it is animated and the frame count
    * generate UVs for just the first frame. 
    * set the frame count on the vertex attributes
    * pass time into the shader
    * in shader use time to adjust UVs to get the correct frame
* suupport ambient occlusion
    * during meshing set AO values using simple equation
    * in shader use AO value at each vertex to shade the side
