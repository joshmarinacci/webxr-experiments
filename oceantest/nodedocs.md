# ThreeJS Node Material System

Despite the name ‘Node’ it has nothing todo with NodeJS. “Node” refers to the draggable lines and boxes system that many visual editors use to create custom materials.

[Cinema 4D | Creating Node-based Materials and Shaders Using cmNodes - Lesterbanks](https://lesterbanks.com/2013/12/cinema-4d-creating-node-based-materials-and-shaders-using-cmnodes/)


There is very little documentation on this. The primary source is the [example code](https://threejs.org/examples/?q=node) and [this blog](https://www.donmccurdy.com/2019/03/17/three-nodematerial-introduction/) by the creator, Don McCurdy.

The node system lets you create a custom material by building up a tree of javascript objects. This tree is then compiled at runtime into the correct shader code.  Writing your material using a tree is more verbose than doing shader code by hand, but it does have some advantages:

* hooking up uniform inputs and timing information for animation is completely automatic. You don’t have to mess with it at all.
* It works with existing standard Three shaders so you don’t have to recreate the entire lighting and shading pipeline. 
* materials built with this system are compossible. Developer A could create a ‘waving grass’ node, then developer B could make a ‘color changing grass’ using the waving grass node, without modifying the original code.
* shaders in other popular systems like Unity and Blender use visual tools to create materials. The output of these tools could be translated into webgl using this system, assuming the correct importers were built. Don has done a prototype of this for [Shade for iOS](https://shade.to/), viewable [here](https://three-shadenodeloader.donmccurdy.com/)
* tutorials for visual shader systems like Unity are now usable by JS devs. It still requires manual translation but the concepts are far closer than when writing raw GLSL shader code.


All of the above advantages are good reasons to use the node material, but it’s still harder to use than it should be. I’m going to try to help by documenting the system and creating small focused examples.

Minimal example.

To use a shader material you must both set up the material and use a special NodeFrame object to update it on every rendering tick. It would typically look like this:

``` javascript
const material = new StandardNodeMaterial();
const frame = new NodeFrame()
//make a random color
material.color = new ColorNode( 0xffffff * Math.random() );

const mesh = new Mesh(
    new PlaneBufferGeometry(20,20),
    material,
)

// in the rendering loop
function tick() {
	frame.setRenderer(renderer).update(delta);
	frame.updateNode(comp.material);

	renderer.render(scene, camera)
	requestAnimationFrame(tick)
}
```

The code above creates a random color for a 20x20 plane every time it is run. The NodeFrame is used in each render tick to properly update the material.

Under the hood this is turned into custom vertex and fragment shaders which are then applied to the object. All uniform management is handled for you.


Of course a single color is boring. Let’s try making a bunch of stripes using a sine wave that goes between green and white.  By taking the sin of the y position of the fragment we can create repeating horizontal stripes.

```javascript

// wave = (sin(5*pos.y)*0.5)+0.5
const pos = new PositionNode()
const posY = new OperatorNode(new SwitchNode(pos,'y'),new FloatNode(5), OperatorNode.MUL)
const wave = new OperatorNode(
    new OperatorNode(
        new MathNode(posY,MathNode.SIN),
        new FloatNode(0.5), OperatorNode.MUL
    ),
    new FloatNode(0.5), OperatorNode.ADD
)

material.color = new MathNode(
    new ColorNode('green'),
    new ColorNode('white'),
    wave,
    MathNode.MIX
)

```


As you can see the code is a straight forward translation of the equation in the comment, but it is *extremely* verbose.


The node system starts becoming more useful once we add some animation.  Instead of taking the sin of pos.y lets multiply it by time first, giving us `sin(5*pos.y + time)*0.5 + 0.5`.

```javascript
const time = new TimerNode();
const pos = new PositionNode()
const posY =
new OperatorNode(
    new OperatorNode(new SwitchNode(pos,'y'),new FloatNode(5), OperatorNode.MUL),
    time, OperatorNode.ADD)
const wave = new OperatorNode(
    new OperatorNode(
        new MathNode(posY,MathNode.SIN),
        new FloatNode(0.5), OperatorNode.MUL
    ),
    new FloatNode(0.5), OperatorNode.ADD
)

material.color = new MathNode(
    new ColorNode('green'),
    new ColorNode('white'),
    wave,
    MathNode.MIX
)
```


There are proposals  for a less verbose syntax like this:

``` javascript

const posY = add(mul(pos.y,f(5)),time)
const wave = add(mul(sin(posY),f(0.5)),f(0.5))
material.color = mix(c('green'),c('white'),wave)
```

It would be implemented as a bunch of utility functions that you can import, which delegate to the full versions.  This is far less verbose but can still be a bit confusing, as it begins to look a lot like Lisp code. 


Let’s take a look at a few of the common nodes you might want to use.

### FloatNode
A floating point constant. Once created it cannot be changed.
### Timer Node
This represents the current time. It’s a float value that goes from 0 to infinity and it represents the time since the app started. It can be used anywhere a float would be used, but it updates on every frame.
### PositionNode
This represents the position of the current fragment in local space. If you want to grab just a single component of it, the you must use the `SwitchNode` (which is horribly named, BTW).
### ColorNode
Represents a color. It’s a vector 4. If you want to access components you’ll need to use a SwigchNode. Color nodes can be initialized with any of the string formats that the rest of Three supports, including CSS colors. So. 0xffffff and ‘white’ and ‘#FFFFFF’ are equivalent.
### SwitchNode
Used to access components of a vector. Can be used to grab multiple components. For example, a vector4 can become a vector2 with `new SwitchNode(value,'xy')`
### OperatorNode
Represents common math operators like addition and multiplication. Always used by passing in the two arguments and then a constant for the operation. Ex: multiplication would be `new OperatorNode(a,b,OperatorNode.MUL)`
### MathNode
I don’t understand the difference between OperatorNode and MathNode. I think MathNode is for mathematical functions like Cosine and Mix and OperatorNode is for operators like `*` and `+`.  It’s used like the OperatorNode. You’ll get an error if you don’t have the correct number of arguments.
### TextureNode
This represents a sample at a current position of a texture. It handles setting up texture samples, binding textures, setting uniforms, etc.  To use it create a TextureNode from a regular ThreeJS texture. Ex:
```javascript
const tex = new TextureLoader().load('grass.png')
material.color = new TextureNode(tex)
```
## Functions
You can write GLSL from scratch as well. This is useful when you have some existing GLSL functions that you want to reuse in your shader.  Ex:
```javascript
```



Examples:

* Port a simple unity shader
* Texture map using alternate coords for a swirl effect
* A toon shader on a sphere

