class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = WebGLUtils.initWebGL(canvas);

        if (!this.gl) {
            throw new Error('WebGL initialization failed');
        }

        this.program = null;
        this.gridProgram = null;
        this.camera = new Camera(canvas);
        this.geometryBuffers = null;
        this.gridBuffers = null;
        this.textures = [];
        this.isRunning = false;

        this.uniforms = {};
        this.attributes = {};
        this.gridUniforms = {};
        this.gridAttributes = {};

        this.initShaderProgram();
        this.initGridShaderProgram();
        this.initGeometry();
        this.initGridGeometry();
        this.setupViewport();
    }

    initShaderProgram() {
        this.program = WebGLUtils.createShaderProgram(
            this.gl,
            Shaders.vertex,
            Shaders.fragment
        );

        if (!this.program) {
            throw new Error('Failed to create shader program');
        }

        this.gl.useProgram(this.program);

        this.uniforms = {
            modelMatrix: this.gl.getUniformLocation(this.program, 'u_modelMatrix'),
            viewMatrix: this.gl.getUniformLocation(this.program, 'u_viewMatrix'),
            projectionMatrix: this.gl.getUniformLocation(this.program, 'u_projectionMatrix'),
            texture: this.gl.getUniformLocation(this.program, 'u_texture'),
            opacity: this.gl.getUniformLocation(this.program, 'u_opacity')
        };

        this.attributes = {
            position: this.gl.getAttribLocation(this.program, 'a_position'),
            texCoord: this.gl.getAttribLocation(this.program, 'a_texCoord')
        };
    }

    initGridShaderProgram() {
        this.gridProgram = WebGLUtils.createShaderProgram(
            this.gl,
            Shaders.gridVertex,
            Shaders.gridFragment
        );

        if (!this.gridProgram) {
            throw new Error('Failed to create grid shader program');
        }

        this.gridUniforms = {
            modelMatrix: this.gl.getUniformLocation(this.gridProgram, 'u_modelMatrix'),
            viewMatrix: this.gl.getUniformLocation(this.gridProgram, 'u_viewMatrix'),
            projectionMatrix: this.gl.getUniformLocation(this.gridProgram, 'u_projectionMatrix'),
            color: this.gl.getUniformLocation(this.gridProgram, 'u_color'),
            opacity: this.gl.getUniformLocation(this.gridProgram, 'u_opacity')
        };

        this.gridAttributes = {
            position: this.gl.getAttribLocation(this.gridProgram, 'a_position')
        };
    }

    initGridGeometry() {
        this.gridBuffers = Grid.setupGridBuffers(this.gl);
    }

    initGeometry() {
        const planeGeometry = Geometry.createPlane(2, 2);
        this.geometryBuffers = Geometry.createBuffers(this.gl, planeGeometry);
    }

    setupViewport() {
        WebGLUtils.resizeCanvas(this.canvas);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    async loadTextures(folder = 'session_01/output/') {
        try {
            console.log('Renderer: Starting texture loading process...');

            if (!this.gl) {
                throw new Error('WebGL context is not available');
            }

            console.log('WebGL context is valid, proceeding with texture loading');
            this.textures = await TextureLoader.loadAll(this.gl, folder);

            console.log(`Renderer: Loaded ${this.textures.length} textures successfully`);

            if (this.textures.length === 0) {
                throw new Error('No textures were successfully loaded');
            }

            // Log each loaded texture for debugging
            this.textures.forEach((tex, index) => {
                console.log(`Renderer: Texture ${index + 1}: ${tex.filename} (Group ${tex.id})`);
            });

            return true;

        } catch (error) {
            console.error('Renderer: Failed to load textures:', error);
            return false;
        }
    }

    render() {
        if (!this.isRunning) return;

        this.setupViewport();

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        if (this.textures.length === 0) {
            requestAnimationFrame(() => this.render());
            return;
        }

        this.gl.useProgram(this.program);

        const viewMatrix = this.camera.getViewMatrix();
        const projectionMatrix = this.camera.getProjectionMatrix();

        this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);
        this.gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);

        Geometry.bindBuffers(this.gl, this.geometryBuffers, this.program);

        this.textures.forEach((textureData) => {
            this.renderGroup(textureData);
        });

        // Render coordinate grid
        this.renderGrid(viewMatrix, projectionMatrix);

        requestAnimationFrame(() => this.render());
    }

    renderGroup(textureData) {
        // Use the actual aspect ratio of the loaded image
        const aspectRatio = textureData.aspectRatio || 1.0;

        // Pass all texture data for exact edge coordinate calculation
        const modelMatrix = Config.createModelMatrix(textureData.id, aspectRatio, this.textures);


        this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureData.texture);
        this.gl.uniform1i(this.uniforms.texture, 0);

        this.gl.uniform1f(this.uniforms.opacity, 1.0);

        this.gl.drawElements(
            this.gl.TRIANGLES,
            this.geometryBuffers.vertexCount,
            this.gl.UNSIGNED_SHORT,
            0
        );
    }

    renderGrid(viewMatrix, projectionMatrix) {
        // Switch to grid shader program
        this.gl.useProgram(this.gridProgram);

        // Set matrices
        this.gl.uniformMatrix4fv(this.gridUniforms.viewMatrix, false, viewMatrix);
        this.gl.uniformMatrix4fv(this.gridUniforms.projectionMatrix, false, projectionMatrix);

        // Identity matrix for grid (no transformation)
        const identityMatrix = new Matrix4().elements;
        this.gl.uniformMatrix4fv(this.gridUniforms.modelMatrix, false, identityMatrix);

        // Enable position attribute
        this.gl.enableVertexAttribArray(this.gridAttributes.position);

        // Render grid lines
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridBuffers.grid.buffer);
        this.gl.vertexAttribPointer(this.gridAttributes.position, 3, this.gl.FLOAT, false, 0, 0);

        // Set grid color (gray)
        this.gl.uniform3f(this.gridUniforms.color, 0.5, 0.5, 0.5);
        this.gl.uniform1f(this.gridUniforms.opacity, 0.3);

        this.gl.drawArrays(this.gl.LINES, 0, this.gridBuffers.grid.vertexCount);

        // Render coordinate axes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridBuffers.axis.buffer);
        this.gl.vertexAttribPointer(this.gridAttributes.position, 3, this.gl.FLOAT, false, 0, 0);

        // X-axis (red)
        this.gl.uniform3f(this.gridUniforms.color, 1.0, 0.0, 0.0);
        this.gl.uniform1f(this.gridUniforms.opacity, 0.8);
        this.gl.drawArrays(this.gl.LINES, 0, 2);

        // Z-axis (blue)
        this.gl.uniform3f(this.gridUniforms.color, 0.0, 0.0, 1.0);
        this.gl.uniform1f(this.gridUniforms.opacity, 0.8);
        this.gl.drawArrays(this.gl.LINES, 2, 2);

        // Y-axis (green)
        this.gl.uniform3f(this.gridUniforms.color, 0.0, 1.0, 0.0);
        this.gl.uniform1f(this.gridUniforms.opacity, 0.8);
        this.gl.drawArrays(this.gl.LINES, 4, 2);

        // Disable attribute
        this.gl.disableVertexAttribArray(this.gridAttributes.position);
    }

    start() {
        this.isRunning = true;
        this.render();
    }

    stop() {
        this.isRunning = false;
    }

    resize() {
        this.setupViewport();
    }

    getTextureCount() {
        return this.textures.length;
    }

    dispose() {
        this.stop();

        if (this.program) {
            this.gl.deleteProgram(this.program);
        }

        if (this.geometryBuffers) {
            this.gl.deleteBuffer(this.geometryBuffers.vertex);
            this.gl.deleteBuffer(this.geometryBuffers.texCoord);
            this.gl.deleteBuffer(this.geometryBuffers.index);
        }

        this.textures.forEach(textureData => {
            this.gl.deleteTexture(textureData.texture);
        });

        this.textures = [];
    }
}

window.Renderer = Renderer;