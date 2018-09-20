/*
* modified from the version from the ThreeJS examples repo
 */

THREE.GPUParticleSystem = function ( options ) {

    THREE.Object3D.apply( this, arguments );

    options = options || {};

    // parse options and use defaults

    this.PARTICLE_COUNT = options.maxParticles || 1000000;
    this.PARTICLE_CONTAINERS = options.containerCount || 1;

    this.PARTICLE_SPRITE_TEXTURE = options.particleSpriteTex || null;


    this.PARTICLES_PER_CONTAINER = Math.ceil( this.PARTICLE_COUNT / this.PARTICLE_CONTAINERS );
    this.PARTICLE_CURSOR = 0;
    this.time = 0;
    this.particleContainers = [];
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
                if (lifeLeft < 0.0) { lifeLeft = 0.0; gl_PointSize = 0.;}
            	if( timeElapsed > 0.0 ) {
            		gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            	} else {
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

    this.random = function () {
        return ++ i >= this.rand.length ? this.rand[ i = 1 ] : this.rand[ i ];
    }

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
        for (let i = 0; i < this.PARTICLE_CONTAINERS; i ++ ) {
            const c = new THREE.GPUParticleContainer(this.PARTICLES_PER_CONTAINER, this)
            this.particleContainers.push( c );
            this.add( c );
        }
    };

    this.spawnParticle = function ( options ) {
        this.PARTICLE_CURSOR ++;
        if ( this.PARTICLE_CURSOR >= this.PARTICLE_COUNT ) {
            this.PARTICLE_CURSOR = 1;
        }
        var currentContainer = this.particleContainers[ Math.floor( this.PARTICLE_CURSOR / this.PARTICLES_PER_CONTAINER ) ];
        currentContainer.spawnParticle( options );
    };

    this.update = function ( time ) {
        for ( var i = 0; i < this.PARTICLE_CONTAINERS; i ++ ) {
            this.particleContainers[ i ].update( time );
        }
    };

    this.dispose = function () {
        this.particleShaderMat.dispose();
        this.particleSpriteTex.dispose();
        for ( var i = 0; i < this.PARTICLE_CONTAINERS; i ++ ) {
            this.particleContainers[ i ].dispose();
        }
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

    var position = new THREE.Vector3();
    var velocity = new THREE.Vector3();
    var color = new THREE.Color();

    this.spawnParticle = function ( options ) {

        var positionStartAttribute = this.particleShaderGeo.getAttribute( 'positionStart' );
        var startTimeAttribute = this.particleShaderGeo.getAttribute( 'startTime' );
        var velocityAttribute = this.particleShaderGeo.getAttribute( 'velocity' );
        var colorAttribute = this.particleShaderGeo.getAttribute( 'color' );
        var sizeAttribute = this.particleShaderGeo.getAttribute( 'size' );
        var lifeTimeAttribute = this.particleShaderGeo.getAttribute( 'lifeTime' );

        options = options || {};

        // setup reasonable default values for all arguments

        position = options.position !== undefined ? position.copy( options.position ) : position.set( 0, 0, 0 );
        velocity = options.velocity !== undefined ? velocity.copy( options.velocity ) : velocity.set( 0, 0, 0 );
        color = options.color !== undefined ? color.set( options.color ) : color.set( 0xffffff );

        var positionRandomness = options.positionRandomness !== undefined ? options.positionRandomness : 0;
        var velocityRandomness = options.velocityRandomness !== undefined ? options.velocityRandomness : 0;
        var colorRandomness = options.colorRandomness !== undefined ? options.colorRandomness : 1;
        var lifetime = options.lifetime !== undefined ? options.lifetime : 5;
        var size = options.size !== undefined ? options.size : 10;
        var sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 0;
        var smoothPosition = options.smoothPosition !== undefined ? options.smoothPosition : false;

        if ( this.DPR !== undefined ) size *= this.DPR;

        var i = this.PARTICLE_CURSOR;

        // position

        positionStartAttribute.array[ i * 3 + 0 ] = position.x + ( particleSystem.random() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 1 ] = position.y + ( particleSystem.random() * positionRandomness );
        positionStartAttribute.array[ i * 3 + 2 ] = position.z + ( particleSystem.random() * positionRandomness );

        if ( smoothPosition === true ) {

            positionStartAttribute.array[ i * 3 + 0 ] += - ( velocity.x * particleSystem.random() );
            positionStartAttribute.array[ i * 3 + 1 ] += - ( velocity.y * particleSystem.random() );
            positionStartAttribute.array[ i * 3 + 2 ] += - ( velocity.z * particleSystem.random() );

        }

        // velocity

        var maxVel = 2;

        var velX = velocity.x + particleSystem.random() * velocityRandomness;
        var velY = velocity.y + particleSystem.random() * velocityRandomness;
        var velZ = velocity.z + particleSystem.random() * velocityRandomness;

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

        if ( this.offset === 0 ) {

            this.offset = this.PARTICLE_CURSOR;

        }

        // counter and cursor

        this.count ++;
        this.PARTICLE_CURSOR ++;

        if ( this.PARTICLE_CURSOR >= this.PARTICLE_COUNT ) {

            this.PARTICLE_CURSOR = 0;

        }

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

    this.geometryUpdate = function () {

        if ( this.particleUpdate === true ) {

            this.particleUpdate = false;

            var positionStartAttribute = this.particleShaderGeo.getAttribute( 'positionStart' );
            var startTimeAttribute = this.particleShaderGeo.getAttribute( 'startTime' );
            var velocityAttribute = this.particleShaderGeo.getAttribute( 'velocity' );
            var colorAttribute = this.particleShaderGeo.getAttribute( 'color' );
            var sizeAttribute = this.particleShaderGeo.getAttribute( 'size' );
            var lifeTimeAttribute = this.particleShaderGeo.getAttribute( 'lifeTime' );

            if ( this.offset + this.count < this.PARTICLE_COUNT ) {

                positionStartAttribute.updateRange.offset = this.offset * positionStartAttribute.itemSize;
                startTimeAttribute.updateRange.offset = this.offset * startTimeAttribute.itemSize;
                velocityAttribute.updateRange.offset = this.offset * velocityAttribute.itemSize;
                colorAttribute.updateRange.offset = this.offset * colorAttribute.itemSize;
                sizeAttribute.updateRange.offset = this.offset * sizeAttribute.itemSize;
                lifeTimeAttribute.updateRange.offset = this.offset * lifeTimeAttribute.itemSize;

                positionStartAttribute.updateRange.count = this.count * positionStartAttribute.itemSize;
                startTimeAttribute.updateRange.count = this.count * startTimeAttribute.itemSize;
                velocityAttribute.updateRange.count = this.count * velocityAttribute.itemSize;
                colorAttribute.updateRange.count = this.count * colorAttribute.itemSize;
                sizeAttribute.updateRange.count = this.count * sizeAttribute.itemSize;
                lifeTimeAttribute.updateRange.count = this.count * lifeTimeAttribute.itemSize;

            } else {

                positionStartAttribute.updateRange.offset = 0;
                startTimeAttribute.updateRange.offset = 0;
                velocityAttribute.updateRange.offset = 0;
                colorAttribute.updateRange.offset = 0;
                sizeAttribute.updateRange.offset = 0;
                lifeTimeAttribute.updateRange.offset = 0;

                // Use -1 to update the entire buffer, see #11476
                positionStartAttribute.updateRange.count = - 1;
                startTimeAttribute.updateRange.count = - 1;
                velocityAttribute.updateRange.count = - 1;
                colorAttribute.updateRange.count = - 1;
                sizeAttribute.updateRange.count = - 1;
                lifeTimeAttribute.updateRange.count = - 1;

            }

            positionStartAttribute.needsUpdate = true;
            startTimeAttribute.needsUpdate = true;
            velocityAttribute.needsUpdate = true;
            colorAttribute.needsUpdate = true;
            sizeAttribute.needsUpdate = true;
            lifeTimeAttribute.needsUpdate = true;

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
