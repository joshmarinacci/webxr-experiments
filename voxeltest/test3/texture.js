// var tic = require('tic')();
// var createAtlas = require('atlaspack');
// var isTransparent = require('opaque').transparent;

const createAtlas = window.atlaspack

function Texture(opts) {
    if (!(this instanceof Texture)) return new Texture(opts || {});
    var self = this;
    this.game = opts.game; delete opts.game;
    this.THREE = opts.THREE;
    this.materials = [];
    this.transparents = [];
    this.texturePath = opts.texturePath || '/textures/';
    this.loading = 0;
    // this.ao = require('voxel-fakeao')(this.game);

    var useFlatColors = opts.materialFlatColor === true;
    delete opts.materialFlatColor;

    this.options = defaults(opts || {}, {
        crossOrigin: 'Anonymous',
        materialParams: defaults(opts.materialParams || {}, {
            ambient: 0xbbbbbb,
            transparent: false,
            side: this.THREE.DoubleSide,
        }),
        materialTransparentParams: defaults(opts.materialTransparentParams || {}, {
            ambient: 0xbbbbbb,
            transparent: true,
            side: this.THREE.DoubleSide,
            //depthWrite: false,
            //depthTest: false
        }),
        materialType: this.THREE.MeshLambertMaterial,
        applyTextureParams: function(map) {
            map.magFilter = self.THREE.NearestFilter;
            map.minFilter = self.THREE.LinearMipMapLinearFilter;
        }
    });

    // create a canvas for the texture atlas
    this.canvas = (typeof document !== 'undefined') ? document.createElement('canvas') : {};
    this.canvas.width = opts.atlasWidth || 512;
    this.canvas.height = opts.atlasHeight || 512;
    var ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // create core atlas and texture
    this.atlas = createAtlas(this.canvas);
    this.atlas.tilepad = true;
    this._atlasuv = false;
    this._atlaskey = false;
    this.texture = new this.THREE.Texture(this.canvas);
    this.options.applyTextureParams(this.texture);

    if (useFlatColors) {
        // If were using simple colors
        this.material = new this.THREE.MeshBasicMaterial({
            vertexColors: this.THREE.VertexColors
        });
    } else {
        var opaque = new this.options.materialType(this.options.materialParams);
        opaque.map = this.texture;
        var transparent = new this.options.materialType(this.options.materialTransparentParams);
        transparent.map = this.texture;
        this.material = new this.THREE.MeshFaceMaterial([
            opaque,
            transparent
        ]);
    }

    // a place for meshes to wait while textures are loading
    this._meshQueue = [];
}
// module.exports = Texture;

Texture.prototype.load = function(names, done) {
    var self = this;
    if (!Array.isArray(names)) names = [names];
    done = done || function() {};
    this.loading++;

    var materialSlice = names.map(self._expandName);
    self.materials = self.materials.concat(materialSlice);

    // load onto the texture atlas
    var load = Object.create(null);
    materialSlice.forEach(function(mats) {
        mats.forEach(function(mat) {
            if (mat.slice(0, 1) === '#') return;
            // todo: check if texture already exists
            load[mat] = true;
        });
    });
    if (Object.keys(load).length > 0) {
        each(Object.keys(load), self.pack.bind(self), function() {
            self._afterLoading();
            done(materialSlice);
        });
    } else {
        self._afterLoading();
    }
};

Texture.prototype.pack = function(name, done) {
    var self = this;
    function pack(img) {
        var node = self.atlas.pack(img);
        if (node === false) {
            self.atlas = self.atlas.expand(img);
            self.atlas.tilepad = true;
        }
        done();
    }
    if (typeof name === 'string') {
        var img = new Image();
        img.id = name;
        img.crossOrigin = self.options.crossOrigin;
        img.src = self.texturePath + ext(name);
        img.onload = function() {
            // if (isTransparent(img)) {
            //   self.transparents.push(name);
            // }
            pack(img);
        };
        img.onerror = function() {
            console.error('Couldn\'t load URL [' + img.src + ']');
            done();
        };
    } else {
        pack(name);
    }
    return self;
};

Texture.prototype.find = function(name) {
    var self = this;
    var type = 0;
    self.materials.forEach(function(mats, i) {
        mats.forEach(function(mat) {
            if (mat === name) {
                type = i + 1;
                return false;
            }
        });
        if (type !== 0) return false;
    });
    return type;
};

Texture.prototype._expandName = function(name) {
    if (name === null) return Array(6);
    if (name.top) return [name.back, name.front, name.top, name.bottom, name.left, name.right];
    if (!Array.isArray(name)) name = [name];
    // load the 0 texture to all
    if (name.length === 1) name = [name[0],name[0],name[0],name[0],name[0],name[0]];
    // 0 is top/bottom, 1 is sides
    if (name.length === 2) name = [name[1],name[1],name[0],name[0],name[1],name[1]];
    // 0 is top, 1 is bottom, 2 is sides
    if (name.length === 3) name = [name[2],name[2],name[0],name[1],name[2],name[2]];
    // 0 is top, 1 is bottom, 2 is front/back, 3 is left/right
    if (name.length === 4) name = [name[2],name[2],name[0],name[1],name[3],name[3]];
    return name;
};

Texture.prototype._afterLoading = function() {
    var self = this;
    function alldone() {
        self.loading--;
        self._atlasuv = self.atlas.uv(self.canvas.width, self.canvas.height);
        self._atlaskey = Object.create(null);
        self.atlas.index().forEach(function(key) {
            self._atlaskey[key.name] = key;
        });
        self.texture.needsUpdate = true;
        self.material.needsUpdate = true;
        //window.open(self.canvas.toDataURL());
        if (self._meshQueue.length > 0) {
            self._meshQueue.forEach(function(queue, i) {
                self.paint.apply(queue.self, queue.args);
                delete self._meshQueue[i];
            });
        }
    }
    self._powerof2(function() {
        setTimeout(alldone, 100);
    });
};

// Ensure the texture stays at a power of 2 for mipmaps
// this is cheating :D
Texture.prototype._powerof2 = function(done) {
    var w = this.canvas.width;
    var h = this.canvas.height;
    function pow2(x) {
        x--;
        x |= x >> 1;
        x |= x >> 2;
        x |= x >> 4;
        x |= x >> 8;
        x |= x >> 16;
        x++;
        return x;
    }
    if (h > w) w = h;
    var old = this.canvas.getContext('2d').getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.width = this.canvas.height = pow2(w);
    this.canvas.getContext('2d').putImageData(old, 0, 0);
    done();
};

Texture.prototype.paint = function(mesh, materials) {
    var self = this;

    // if were loading put into queue
    if (self.loading > 0) {
        self._meshQueue.push({self: self, args: arguments});
        return false;
    }

    var isVoxelMesh = (materials) ? false : true;
    if (!isVoxelMesh) materials = self._expandName(materials);

    mesh.geometry.faces.forEach(function(face, i) {
        if (mesh.geometry.faceVertexUvs[0].length < 1) return;

        if (isVoxelMesh) {
            var index = Math.floor(face.color.b*255 + face.color.g*255*255 + face.color.r*255*255*255);
            materials = self.materials[index - 1];
            if (!materials) materials = self.materials[0];
        }

        // BACK, FRONT, TOP, BOTTOM, LEFT, RIGHT
        var name = materials[0] || '';
        if      (face.normal.z === 1)  name = materials[1] || '';
        else if (face.normal.y === 1)  name = materials[2] || '';
        else if (face.normal.y === -1) name = materials[3] || '';
        else if (face.normal.x === -1) name = materials[4] || '';
        else if (face.normal.x === 1)  name = materials[5] || '';

        // if just a simple color
        if (name.slice(0, 1) === '#') {
            self.ao(face, name);
            return;
        }

        var atlasuv = self._atlasuv[name];
        if (!atlasuv) return;

        // If a transparent texture use transparent material
        face.materialIndex = (self.transparents.indexOf(name) !== -1) ? 1 : 0;

        // 0 -- 1
        // |    |
        // 3 -- 2
        // faces on these meshes are flipped vertically, so we map in reverse
        // TODO: tops need rotate
        if (isVoxelMesh) {
            if (face.normal.z === -1 || face.normal.x === 1) {
                atlasuv = uvrot(atlasuv, 90);
            }
            atlasuv = uvinvert(atlasuv);
        } else {
            atlasuv = uvrot(atlasuv, -90);
        }
        for (var j = 0; j < mesh.geometry.faceVertexUvs[0][i].length; j++) {
            mesh.geometry.faceVertexUvs[0][i][j].set(atlasuv[j][0], 1 - atlasuv[j][1]);
        }
    });

    mesh.geometry.uvsNeedUpdate = true;
};

Texture.prototype.sprite = function(name, w, h, cb) {
    var self = this;
    if (typeof w === 'function') { cb = w; w = null; }
    if (typeof h === 'function') { cb = h; h = null; }
    w = w || 16; h = h || w;
    self.loading++;
    var img = new Image();
    img.src = self.texturePath + ext(name);
    img.onerror = cb;
    img.onload = function() {
        var canvases = [];
        for (var x = 0; x < img.width; x += w) {
            for (var y = 0; y < img.height; y += h) {
                var canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.name = name + '_' + x + '_' + y;
                canvas.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
                canvases.push(canvas);
            }
        }
        var textures = [];
        each(canvases, function(canvas, next) {
            var tex = new Image();
            tex.name = canvas.name;
            tex.src = canvas.toDataURL();
            tex.onload = function() {
                self.pack(tex, next);
            };
            tex.onerror = next;
            textures.push([
                tex.name, tex.name, tex.name,
                tex.name, tex.name, tex.name
            ]);
        }, function() {
            self._afterLoading();
            delete canvases;
            self.materials = self.materials.concat(textures);
            cb(textures);
        });
    };
    return self;
};

Texture.prototype.animate = function(mesh, names, delay) {
    var self = this;
    delay = delay || 1000;
    if (!Array.isArray(names) || names.length < 2) return false;
    var i = 0;
    var mat = new this.options.materialType(this.options.materialParams);
    mat.map = this.texture;
    mat.transparent = true;
    mat.needsUpdate = true;
    // tic.interval(function() {
    //   self.paint(mesh, names[i % names.length]);
    //   i++;
    // }, delay);
    return mat;
};

Texture.prototype.tick = function(dt) {
    // tic.tick(dt);
};

function uvrot(coords, deg) {
    if (deg === 0) return coords;
    var c = [];
    var i = (4 - Math.ceil(deg / 90)) % 4;
    for (var j = 0; j < 4; j++) {
        c.push(coords[i]);
        if (i === 3) i = 0; else i++;
    }
    return c;
}

function uvinvert(coords) {
    var c = coords.slice(0);
    return [c[3], c[2], c[1], c[0]];
}

function ext(name) {
    return (String(name).indexOf('.') !== -1) ? name : name + '.png';
}

function defaults(obj) {
    [].slice.call(arguments, 1).forEach(function(from) {
        if (from) for (var k in from) if (obj[k] == null) obj[k] = from[k];
    });
    return obj;
}

function each(arr, it, done) {
    var count = 0;
    arr.forEach(function(a) {
        it(a, function() {
            count++;
            if (count >= arr.length) done();
        });
    });
}
