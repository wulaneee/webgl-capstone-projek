const Config = {
    // Global configuration for coordinate-based positioning
    pixelToWebGLScale: 0.005, // Scale factor to convert pixels to WebGL coordinates (smaller = more compact)
    loggedWalls: new Set(), // Track which walls have been logged to prevent repetition
    firstWallLogged: false, // Track if first wall debug info has been logged

    getConfiguration(groupId) {
        return this.getDefaultConfiguration();
    },

    getDefaultConfiguration() {
        return {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            baseScale: 1
        };
    },

    /**
     * Create model matrix for a wall based on its groupId and texture data
     * Supports dynamic number of walls:
     * - 4 walls: Rectangular room layout
     * - Other counts: Linear or semi-circular arrangement
     */
    createModelMatrix(groupId, aspectRatio = 1.0, allTextureData = []) {
        const matrix = new Matrix4();

        if (allTextureData.length === 0) {
            return new Matrix4().scale(0, 0, 0).elements; // Make invisible
        }

        const currentWall = allTextureData.find(tex => tex.id === groupId);
        if (!currentWall) {
            console.warn(`Wall ${groupId} texture data not found`);
            return new Matrix4().scale(0, 0, 0).elements; // Make invisible
        }

        // Use actual pixel dimensions converted to WebGL coordinates
        const pixelToWebGLScale = this.pixelToWebGLScale;
        const width = currentWall.width * pixelToWebGLScale;
        const height = currentWall.height * pixelToWebGLScale;

        // Set scale correctly: base geometry is 2 units wide (-1 to +1)
        const scaleX = width / 2;  // Scale from 2 units to desired width
        const scaleY = height / 2; // Scale from 2 units to desired height

        let position, rotation, startCoord, endCoord;

        // Choose layout based on number of walls
        const wallCount = allTextureData.length;

        if (wallCount === 4) {
            // RECTANGULAR ROOM LAYOUT (for exactly 4 walls)
            const result = this.calculateRectangularLayout(groupId, width, height, allTextureData, pixelToWebGLScale);
            position = result.position;
            rotation = result.rotation;
            startCoord = result.startCoord;
            endCoord = result.endCoord;
        } else if (wallCount === 2) {
            // CORNER LAYOUT (for 2 walls forming an L-shape, both facing inward)
            const result = this.calculateCornerLayout(groupId, width, height, allTextureData, pixelToWebGLScale);
            position = result.position;
            rotation = result.rotation;
            startCoord = result.startCoord;
            endCoord = result.endCoord;
        } else {
            // LINEAR ROW LAYOUT (for any other count)
            const result = this.calculateLinearLayout(groupId, width, height, allTextureData, pixelToWebGLScale);
            position = result.position;
            rotation = result.rotation;
            startCoord = result.startCoord;
            endCoord = result.endCoord;
        }

        // Log detailed information ONLY ONCE per wall
        if (!this.loggedWalls.has(groupId)) {
            console.log(`=== WALL ${groupId} DEBUG ===`);
            console.log(`Texture dimensions: ${currentWall.width} x ${currentWall.height} pixels`);
            console.log(`WebGL scale factor: ${pixelToWebGLScale}`);
            console.log(`WebGL dimensions: ${width.toFixed(3)} x ${height.toFixed(3)} units`);
            console.log(`ScaleX applied: ${scaleX.toFixed(3)}`);
            console.log(`ScaleY applied: ${scaleY.toFixed(3)}`);
            console.log(`Wall center position: [${position.join(', ')}]`);
            console.log(`Wall START coordinate: [${startCoord.join(', ')}]`);
            console.log(`Wall END coordinate: [${endCoord.join(', ')}]`);
            console.log(`Wall rotation: [${rotation.map(r => (r * 180 / Math.PI).toFixed(1)).join(', ')}]° (YXZ)`);

            let layoutMode;
            if (wallCount === 4) {
                layoutMode = 'Rectangular Room (4 walls)';
            } else if (wallCount === 2) {
                layoutMode = 'Corner L-Shape (2 walls, both facing inward)';
            } else {
                layoutMode = 'Linear Row';
            }
            console.log(`Layout mode: ${layoutMode}`);
            console.log('========================');
            this.loggedWalls.add(groupId);
        }

        matrix.identity()
              .translate(position[0], position[1], position[2])
              .rotateX(rotation[0])
              .rotateY(rotation[1])
              .rotateZ(rotation[2])
              .scale(scaleX, scaleY, 1);

        return matrix.elements;
    },

    /**
     * Calculate position and rotation for rectangular room layout (4 walls)
     */
    calculateRectangularLayout(groupId, width, height, allTextureData, pixelToWebGLScale) {
        const firstWall = allTextureData.find(tex => tex.id === 1);
        const secondWall = allTextureData.find(tex => tex.id === 2);
        const thirdWall = allTextureData.find(tex => tex.id === 3);
        const firstWallWidth = firstWall ? firstWall.width * pixelToWebGLScale : 0;
        const secondWallWidth = secondWall ? secondWall.width * pixelToWebGLScale : 0;
        const thirdWallWidth = thirdWall ? thirdWall.width * pixelToWebGLScale : 0;

        let position, rotation, startCoord, endCoord;

        if (groupId === 1) {
            // FIRST WALL: Start at origin
            position = [width/2, height/2, 0];
            rotation = [0, 0, 0];
            startCoord = [0, 0, 0];
            endCoord = [width, 0, 0];
        } else if (groupId === 2) {
            // SECOND WALL: Perpendicular to first
            position = [firstWallWidth, height/2, width/2];
            rotation = [0, Math.PI/2, 0];
            startCoord = [firstWallWidth, 0, 0];
            endCoord = [firstWallWidth, 0, width];
        } else if (groupId === 3) {
            // THIRD WALL: Opposite to first
            position = [firstWallWidth - width/2, height/2, secondWallWidth];
            rotation = [0, Math.PI, 0];
            startCoord = [firstWallWidth, 0, secondWallWidth];
            endCoord = [firstWallWidth - width, 0, secondWallWidth];
        } else if (groupId === 4) {
            // FOURTH WALL: Closes the rectangle
            position = [firstWallWidth - thirdWallWidth, height/2, secondWallWidth - width/2];
            rotation = [0, -Math.PI/2, 0];
            startCoord = [firstWallWidth - thirdWallWidth, 0, secondWallWidth];
            endCoord = [firstWallWidth - thirdWallWidth, 0, secondWallWidth - width];
        } else {
            // Fallback for groupId > 4 in rectangular mode
            position = [0, height/2, 0];
            rotation = [0, 0, 0];
            startCoord = [0, 0, 0];
            endCoord = [0, 0, 0];
        }

        return { position, rotation, startCoord, endCoord };
    },

    /**
     * Calculate position and rotation for corner layout (2 walls forming L-shape)
     * Both walls face inward towards the viewer
     * Wall 1: Starts at origin, extends along X-axis, faces towards negative Z (inward)
     * Wall 2: Perpendicular to wall 1, extends along negative Z-axis, faces towards negative X (inward)
     */
    calculateCornerLayout(groupId, width, height, allTextureData, pixelToWebGLScale) {
        const firstWall = allTextureData.find(tex => tex.id === 1);
        const firstWallWidth = firstWall ? firstWall.width * pixelToWebGLScale : 0;

        let position, rotation, startCoord, endCoord;

        if (groupId === 1) {
            // FIRST WALL: Along X-axis, facing towards negative Z (into the corner)
            position = [width/2, height/2, 0];
            rotation = [0, 0, 0]; // Face forward (towards -Z)
            startCoord = [0, 0, 0];
            endCoord = [width, 0, 0];
        } else if (groupId === 2) {
            // SECOND WALL: Perpendicular to first, extending along negative Z-axis
            // Positioned at the END of first wall, facing towards negative X (into the corner)
            position = [firstWallWidth, height/2, -width/2];
            rotation = [0, -Math.PI/2, 0]; // Rotate -90° to face left (towards -X)
            startCoord = [firstWallWidth, 0, 0];
            endCoord = [firstWallWidth, 0, -width];
        } else {
            // Fallback for unexpected groupId
            position = [0, height/2, 0];
            rotation = [0, 0, 0];
            startCoord = [0, 0, 0];
            endCoord = [0, 0, 0];
        }

        return { position, rotation, startCoord, endCoord };
    },

    /**
     * Calculate position and rotation for linear row layout (any number of walls)
     * Walls are placed in a row along the X-axis
     */
    calculateLinearLayout(groupId, width, height, allTextureData, pixelToWebGLScale) {
        // Calculate cumulative X position
        let xOffset = 0;
        for (let i = 0; i < allTextureData.length; i++) {
            const wall = allTextureData[i];
            if (wall.id < groupId) {
                xOffset += wall.width * pixelToWebGLScale;
            } else if (wall.id === groupId) {
                break;
            }
        }

        // Position wall center at xOffset + half its width
        const position = [xOffset + width/2, height/2, 0];
        const rotation = [0, 0, 0]; // All walls face forward
        const startCoord = [xOffset, 0, 0];
        const endCoord = [xOffset + width, 0, 0];

        return { position, rotation, startCoord, endCoord };
    },

    // Legacy methods - no longer used but kept for compatibility
    getAllConfigurations() {
        return {};
    },

    updateConfiguration(groupId, newConfig) {
        console.log(`updateConfiguration is deprecated - positions are now calculated dynamically`);
    },

    setPixelScale(scale) {
        this.pixelToWebGLScale = scale;
        this.loggedWalls.clear();
        this.firstWallLogged = false;
        console.log(`Updated pixel-to-WebGL scale factor to: ${scale}`);
    },

    clearLoggedWalls() {
        this.loggedWalls.clear();
        this.firstWallLogged = false;
        console.log('Cleared wall logging cache');
    },

    calculateWallStartEdge(groupId, wallWidths) {
        // Calculate where each wall starts based on sequential connection
        switch(groupId) {
            case 1: return [0, 0, 0];
            case 2: return [wallWidths[0], 0, 0];
            case 3: return [wallWidths[0], 0, wallWidths[1]];
            case 4: return [0, 0, wallWidths[1]];
            default: return [0, 0, 0];
        }
    },

    calculateWallEndEdge(groupId, wallWidths) {
        // Calculate where each wall ends based on sequential connection
        switch(groupId) {
            case 1: return [wallWidths[0], 0, 0];
            case 2: return [wallWidths[0], 0, wallWidths[1]];
            case 3: return [0, 0, wallWidths[1]];
            case 4: return [0, 0, 0];
            default: return [0, 0, 0];
        }
    }
};

Matrix4.prototype.scale = function(x, y, z) {
    const te = this.elements;

    te[0] *= x; te[4] *= y; te[8] *= z;
    te[1] *= x; te[5] *= y; te[9] *= z;
    te[2] *= x; te[6] *= y; te[10] *= z;
    te[3] *= x; te[7] *= y; te[11] *= z;

    return this;
};

window.Config = Config;
