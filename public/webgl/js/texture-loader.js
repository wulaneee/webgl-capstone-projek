class TextureLoader {
    static async detectImages(folder = 'session_01/output/') {
        // For the square layout, we only need 4 images
        const knownImages = [
            { id: 1, filename: 'stitched_group_1.jpg' },
            { id: 2, filename: 'stitched_group_2.jpg' },
            { id: 3, filename: 'stitched_group_3.jpg' },
            { id: 4, filename: 'stitched_group_4.jpg' }
        ];

        const images = [];

        for (const imageInfo of knownImages) {
            const path = `${folder}${imageInfo.filename}`;
            try {
                // Try to load the image to verify it exists
                await this.checkImageExists(path);
                images.push({
                    id: imageInfo.id,
                    filename: imageInfo.filename,
                    path: path
                });
            } catch (error) {
                // Image doesn't exist, skip it
                console.log(`Image ${imageInfo.filename} not found, skipping`);
            }
        }

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

            console.log(`Checking image: ${src}`);
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

    static async loadAll(gl, folder = 'session_01/output/') {
        try {
            const imageList = await this.detectImages(folder);
            console.log(`Detected ${imageList.length} stitched images`);

            if (imageList.length === 0) {
                throw new Error('No stitched images found');
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