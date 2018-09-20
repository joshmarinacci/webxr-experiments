/*
* modified from the version from the ThreeJS examples repo
 */

THREE.GPUParticleSystem = function ( options ) {

    THREE.Object3D.apply( this, arguments );
    options = options || {};
    // parse options and use defaults

    this.PARTICLE_COUNT = options.maxParticles || 1000000;
    this.PARTICLE_SPRITE_TEXTURE = options.particleSpriteTex || null;
    this.PARTICLE_CURSOR = 0;
    this.time = 0;
    this.rand = [];

    // custom vertex and fragement shader

    var GPUParticleShader = {

        vertexShader:
            `
            uniform float uTime;
            uniform float uScale;

            attribute vec3 positionStart;
            attribute float startTime;
            attribute vec3 velocity;
            attribute vec3 color;
            attribute float size;
            attribute float lifeTime;

            varying vec4 vColor;
            varying float lifeLeft;

            void main() {
            	vColor = vec4( color, 1.0 );
            	vec3 newPosition;
            	vec3 v;
            	float timeElapsed = uTime - startTime;
            	lifeLeft = 1.0 - ( timeElapsed / lifeTime );
            	gl_PointSize = ( uScale * size ) * lifeLeft;
            	v.x = ( velocity.x - 0.5 ) * 1.0;
            	v.y = ( velocity.y - 0.5 ) * 1.0;
            	v.z = ( velocity.z - 0.5 ) * 1.0;
            	newPosition = positionStart + v * timeElapsed;
                if (lifeLeft < 0.0) { 
                    lifeLeft = 0.0; 
                    gl_PointSize = 0.;
                }
                //while active use the new position
            	if( timeElapsed > 0.0 ) {
            		gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            	} else {
            	    //if dead use the initial position and set point size to 0
            		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            		lifeLeft = 0.0;
            		gl_PointSize = 0.;

            	}
            }
            `
        ,

        fragmentShader: `
            varying vec4 vColor;
            varying float lifeLeft;
            uniform sampler2D tSprite;
            void main() {
                // color based on particle texture and the lifeLeft. 
                // if lifeLeft is 0 then make invisible
            	vec4 tex = texture2D( tSprite, gl_PointCoord );
            	gl_FragColor = vec4( vColor.rgb * tex.a, lifeLeft * tex.a );
            }

        `
    };

    // preload a million random numbers
    var i;
    for ( i = 1e5; i > 0; i -- ) {
        this.rand.push( Math.random() - 0.5 );
    }
    //use one of the random numbers
    this.random = function () {
        return ++ i >= this.rand.length ? this.rand[ i = 1 ] : this.rand[ i ];
    }

    //setup the texture and material
    this.particleSpriteTex = this.PARTICLE_SPRITE_TEXTURE
    if(!this.particleSpriteTex) throw new Error("No particle sprite texture specified")
    this.particleSpriteTex.wrapS = this.particleSpriteTex.wrapT = THREE.RepeatWrapping;

    this.particleShaderMat = new THREE.ShaderMaterial( {
        transparent: true,
        depthWrite: false,
        uniforms: {
            'uTime': {
                value: 0.0
            },
            'uScale': {
                value: 1.0
            },
            'tSprite': {
                value: this.particleSpriteTex
            }
        },
        blending: THREE.AdditiveBlending,
        vertexShader: GPUParticleShader.vertexShader,
        fragmentShader: GPUParticleShader.fragmentShader
    } );

    // define defaults for all values
    this.particleShaderMat.defaultAttributeValues.particlePositionsStartTime = [ 0, 0, 0, 0 ];
    this.particleShaderMat.defaultAttributeValues.particleVelColSizeLife = [ 0, 0, 0, 0 ];

    this.init = function () {
        this.container = new THREE.GPUParticleContainer(this.PARTICLE_COUNT, this)
        this.add( this.container );
    };

    this.spawnParticle = function ( options ) {
        this.PARTICLE_CURSOR ++;
        if ( this.PARTICLE_CURSOR >= this.PARTICLE_COUNT ) {
            this.PARTICLE_CURSOR = 1;
        }
        this.container.spawnParticle( options );
    };

    this.update = function ( time ) {
        this.container.update(time)
    };

    this.dispose = function () {
        this.particleShaderMat.dispose();
        this.particleSpriteTex.dispose();
        this.container.dispose()
    };
    this.init();
};

THREE.GPUParticleSystem.prototype = Object.create( THREE.Object3D.prototype );
THREE.GPUParticleSystem.prototype.constructor = THREE.GPUParticleSystem;


// Subclass for particle containers, allows for very large arrays to be spread out

THREE.GPUParticleContainer = function ( maxParticles, particleSystem ) {

    THREE.Object3D.apply( this, arguments );

    this.PARTICLE_COUNT = maxParticles || 100000;
    this.PARTICLE_CURSOR = 0;
    this.time = 0;
    this.offset = 0;
    this.count = 0;
    this.DPR = window.devicePixelRatio;
    this.GPUParticleSystem = particleSystem;
    this.particleUpdate = false;

    // geometry

    this.particleShaderGeo = new THREE.BufferGeometry();

    this.particleShaderGeo.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'positionStart', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'startTime', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT ), 1 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'velocity', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT * 3 ), 3 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'size', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT ), 1 ).setDynamic( true ) );
    this.particleShaderGeo.addAttribute( 'lifeTime', new THREE.BufferAttribute( new Float32Array( this.PARTICLE_COUNT ), 1 ).setDynamic( true ) );

    // material

    this.particleShaderMat = this.GPUParticleSystem.particleShaderMat;

    let position = new THREE.Vector3()
    let velocity = new THREE.Vector3()
    let color = new THREE.Color()

    /* spawn a particle

    This works by updating values inside of
    the attribute arrays, then updates the count and the PARTICLE_CURSOR and
    sets particleUpdate to true.

    This if spawnParticle is called three times in a row before rendering,
    then count will be 3 and the cursor will have moved by three.
     */
    this.spawnParticle = function ( options ) {

        const positionStartAttribute = this.particleShaderGeo.getAttribute('positionStart')
        const startTimeAttribute = this.particleShaderGeo.getAttribute('startTime')
        const velocityAttribute = this.particleShaderGeo.getAttribute('velocity')
        const colorAttribute = this.particleShaderGeo.getAttribute('color')
        const sizeAttribute = this.particleShaderGeo.getAttribute('size')
        const lifeTimeAttribute = this.particleShaderGeo.getAttribute('lifeTime')

        options = options || {};

        // setup reasonable default values for all arguments

        position = options.position !== undefined ? position.copy( options.position ) : position.set( 0, 0, 0 );
        velocity = options.velocity !== undefined ? velocity.copy( options.velocity ) : velocity.set( 0, 0, 0 );
        color    = options.color    !== undefined ? color.set( options.color )        : color.set( 0xffffff );

        const positionRandomness = options.positionRandomness !== undefined ? options.positionRandomness : 0
        const velocityRandomness = options.velocityRandomness !== undefined ? options.velocityRandomness : 0
        const colorRandomness = options.colorRandomness !== undefined ? options.colorRandomness : 1
        const lifetime = options.lifetime !== undefined ? options.lifetime : 5
        let size = options.size !== undefined ? options.size : 10
        const sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 0

        if ( this.DPR !== undefined ) size *= this.DPR;

        const i = this.PARTICLE_CURSOR

        // position
        positionStartAttribute.array[ i * 3 + 0 ] = position.x + ( particleSystem.random() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 1 ] = position.y + ( particleSystem.random() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 2 ] = position.z + ( particleSystem.random() * positionRandomness );

        // velocity
        let maxVel = 200
        let velX = velocity.x + particleSystem.random() * velocityRandomness
        let velY = velocity.y + particleSystem.random() * velocityRandomness
        let velZ = velocity.z + particleSystem.random() * velocityRandomness
        velX = THREE.Math.clamp( ( velX - ( - maxVel ) ) / ( maxVel - ( - maxVel ) ), 0, 1 );
        velY = THREE.Math.clamp( ( velY - ( - maxVel ) ) / ( maxVel - ( - maxVel ) ), 0, 1 );
        velZ = THREE.Math.clamp( ( velZ - ( - maxVel ) ) / ( maxVel - ( - maxVel ) ), 0, 1 );
        velocityAttribute.array[ i * 3 + 0 ] = velX;
        velocityAttribute.array[ i * 3 + 1 ] = velY;
        velocityAttribute.array[ i * 3 + 2 ] = velZ;

        // color
        color.r = THREE.Math.clamp( color.r + particleSystem.random() * colorRandomness, 0, 1 );
        color.g = THREE.Math.clamp( color.g + particleSystem.random() * colorRandomness, 0, 1 );
        color.b = THREE.Math.clamp( color.b + particleSystem.random() * colorRandomness, 0, 1 );
        colorAttribute.array[ i * 3 + 0 ] = color.r;
        colorAttribute.array[ i * 3 + 1 ] = color.g;
        colorAttribute.array[ i * 3 + 2 ] = color.b;

        //size, lifetime and starttime
        sizeAttribute.array[ i ] = size + particleSystem.random() * sizeRandomness;
        lifeTimeAttribute.array[ i ] = lifetime;
        startTimeAttribute.array[ i ] = this.time + particleSystem.random() * 2e-2;

        // offset
        if ( this.offset === 0 ) this.offset = this.PARTICLE_CURSOR;
        // counter and cursor
        this.count ++;
        this.PARTICLE_CURSOR ++;
        //wrap the cursor around
        if ( this.PARTICLE_CURSOR >= this.PARTICLE_COUNT ) this.PARTICLE_CURSOR = 0;
        this.particleUpdate = true;
    };

    this.init = function () {
        this.particleSystem = new THREE.Points( this.particleShaderGeo, this.particleShaderMat );
        this.particleSystem.frustumCulled = false;
        this.add( this.particleSystem );
    };

    this.update = function ( time ) {
        this.time = time;
        this.particleShaderMat.uniforms.uTime.value = time;
        this.geometryUpdate();
    };

    /*
      This updates the geometry on the shader if at least one particle has been spawned.
      It uses the offset and the count to determine which part of the data needs to actually
      be sent to the GPU. This ensures no more data than necessary is sent to the GPU
     */
    this.attrNames = ['positionStart','startTime', 'velocity', 'color', 'size', 'lifeTime']
    this.geometryUpdate = function () {
        if ( this.particleUpdate === true ) {
            this.particleUpdate = false;
            this.attrNames.forEach(name => {
                const attr = this.particleShaderGeo.getAttribute(name)
                if ( this.offset + this.count < this.PARTICLE_COUNT ) {
                    attr.updateRange.offset = this.offset * attr.itemSize
                    attr.updateRange.count = this.count * attr.itemSize
                } else {
                    attr.updateRange.offset = 0
                    attr.updateRange.count = -1
                }
                attr.needsUpdate = true
            })
            this.offset = 0;
            this.count = 0;
        }

    };

    this.dispose = function () {
        this.particleShaderGeo.dispose();
    };
    this.init();
};

THREE.GPUParticleContainer.prototype = Object.create( THREE.Object3D.prototype );
THREE.GPUParticleContainer.prototype.constructor = THREE.GPUParticleContainer;
