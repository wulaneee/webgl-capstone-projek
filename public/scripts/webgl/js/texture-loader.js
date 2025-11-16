class TextureLoader {
    /**
     * Detect all stitched images for a session and version
     * @param {string} sessionId - Session ID (e.g., 'session_01')
     * @param {string} version - Version type ('original' or 'segmented')
     * @returns {Promise<Array>} Array of image info objects
     */
    static async detectImages(sessionId = 'session_01', version = 'original') {
        const versionFolder = version === 'segmented' ? 'stitched_segmentation' : 'stitched';
        const basePath = `/source/${sessionId}/output/${versionFolder}/`;

        console.log(`Detecting images for session: ${sessionId}, version: ${version}`);
        console.log(`Base path: ${basePath}`);

        // Try to detect up to 20 groups (should be more than enough)
        const maxGroups = 20;
        const images = [];

        for (let i = 1; i <= maxGroups; i++) {
            const filename = `stitched_group_${i}.jpg`;
            const path = `${basePath}${filename}`;

            try {
                await this.checkImageExists(path);
                images.push({
                    id: i,
                    filename: filename,
                    path: path
                });
                console.log(`✓ Found group ${i}`);
            } catch (error) {
                // Image doesn't exist
                // If we haven't found any images yet, keep trying
                if (images.length === 0 && i < 5) {
                    continue;
                }
                // If we found some images and now missing one, assume we're done
                if (images.length > 0) {
                    break;
                }
            }
        }

        console.log(`Detected ${images.length} images for ${sessionId} (${version})`);
        return images;
    }

    static checkImageExists(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                console.log(`✓ Image exists: ${src} (${img.width}x${img.height})`);
                resolve(true);
            };

            img.onerror = (error) => {
                console.log(`✗ Image not found: ${src}`);
                reject(false);
            };

            img.src = src;
        });
    }

    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            // For local files, don't set crossOrigin at all
            // Only set crossOrigin for remote URLs
            if (src.startsWith('http://') || src.startsWith('https://')) {
                img.crossOrigin = 'anonymous';
            }

            img.onload = () => {
                console.log(`Successfully loaded image: ${src} (${img.width}x${img.height})`);
                resolve(img);
            };

            img.onerror = (error) => {
                console.error(`Failed to load image: ${src}`, error);
                reject(error);
            };

            img.src = src;
        });
    }

    static createTextureFromCanvas(gl, image) {
        try {
            console.log('Attempting canvas-based texture creation...');

            // Create a canvas to copy the image data, avoiding CORS issues
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = image.width;
            canvas.height = image.height;

            // Clear canvas first
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the image onto the canvas
            ctx.drawImage(image, 0, 0);

            console.log('Image drawn to canvas successfully');

            // Create texture from canvas instead of image
            return this.createTextureFromCanvasElement(gl, canvas);

        } catch (error) {
            console.error('Canvas-based texture creation failed:', error);

            // Last resort: create a placeholder texture
            return this.createPlaceholderTexture(gl);
        }
    }

    static createPlaceholderTexture(gl) {
        console.log('Creating placeholder texture...');

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 256;
            canvas.height = 256;

            // Create a colorful placeholder
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Image', 128, 120);
            ctx.fillText('Placeholder', 128, 150);

            return this.createTextureFromCanvasElement(gl, canvas);

        } catch (error) {
            console.error('Even placeholder texture creation failed:', error);
            return null;
        }
    }

    static createTextureFromCanvasElement(gl, canvas) {
        try {
            console.log(`Creating WebGL texture from canvas: ${canvas.width}x${canvas.height}`);

            const texture = gl.createTexture();
            if (!texture) {
                console.error('Failed to create WebGL texture object');
                return null;
            }

            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Upload the canvas data (no CORS issues)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

            // Check for WebGL errors
            const error = gl.getError();
            if (error !== gl.NO_ERROR) {
                console.error('WebGL error during texture creation:', error);
                gl.deleteTexture(texture);
                return null;
            }

            console.log('WebGL texture created successfully from canvas');
            return texture;

        } catch (error) {
            console.error('Exception during texture creation from canvas:', error);
            return null;
        }
    }

    static createTexture(gl, image) {
        if (!gl || !image) {
            console.error('Invalid parameters for texture creation', { gl: !!gl, image: !!image });
            return null;
        }

        try {
            console.log(`Creating WebGL texture directly from image: ${image.width}x${image.height}`);

            const texture = gl.createTexture();
            if (!texture) {
                console.error('Failed to create WebGL texture object');
                return null;
            }

            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Try direct upload first (for local files without CORS issues)
            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                console.log('✓ Direct texture upload successful');
            } catch (corsError) {
                console.log('Direct upload failed, trying canvas approach...', corsError.message);
                // Fall back to canvas approach
                return this.createTextureFromCanvas(gl, image);
            }

            // Check for WebGL errors
            const error = gl.getError();
            if (error !== gl.NO_ERROR) {
                console.error('WebGL error during texture creation:', error);
                gl.deleteTexture(texture);
                return null;
            }

            console.log('WebGL texture created successfully');
            return texture;

        } catch (error) {
            console.error('Exception during texture creation:', error);
            return null;
        }
    }

    static async loadTextures(gl, imageList) {
        console.log(`Starting to load ${imageList.length} textures...`);
        const textures = [];
        const loadPromises = [];

        for (const imageInfo of imageList) {
            console.log(`Queuing load for: ${imageInfo.path}`);

            const loadPromise = this.loadImage(imageInfo.path)
                .then(image => {
                    console.log(`Image loaded successfully: ${imageInfo.filename}`);
                    const texture = this.createTexture(gl, image);

                    if (!texture) {
                        console.error(`Failed to create texture for ${imageInfo.filename}`);
                        return null;
                    }

                    return {
                        id: imageInfo.id,
                        texture: texture,
                        width: image.width,
                        height: image.height,
                        aspectRatio: image.width / image.height,
                        filename: imageInfo.filename
                    };
                })
                .catch(error => {
                    console.error(`Failed to load texture for group ${imageInfo.id} (${imageInfo.filename}):`, error);
                    return null;
                });

            loadPromises.push(loadPromise);
        }

        const results = await Promise.all(loadPromises);
        const validTextures = results.filter(result => result !== null && result.texture !== null);

        console.log(`Successfully loaded ${validTextures.length} out of ${imageList.length} textures`);
        validTextures.forEach(tex => {
            console.log(`✓ Texture loaded: ${tex.filename} (${tex.width}x${tex.height})`);
        });

        return validTextures;
    }

    /**
     * Load all textures for a session and version
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {string} sessionId - Session ID
     * @param {string} version - Version type ('original' or 'segmented')
     * @returns {Promise<Array>} Array of loaded textures
     */
    static async loadAll(gl, sessionId = 'session_01', version = 'original') {
        try {
            const imageList = await this.detectImages(sessionId, version);
            console.log(`Detected ${imageList.length} stitched images for ${sessionId} (${version})`);

            if (imageList.length === 0) {
                throw new Error(`No stitched images found for ${sessionId} (${version})`);
            }

            const textures = await this.loadTextures(gl, imageList);
            console.log(`Successfully loaded ${textures.length} textures`);

            return textures;
        } catch (error) {
            console.error('Error loading textures:', error);
            throw error;
        }
    }
}

window.TextureLoader = TextureLoader;
