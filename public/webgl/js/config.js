const Config = {
    // Global configuration for coordinate-based positioning
    pixelToWebGLScale: 0.005, // Scale factor to convert pixels to WebGL coordinates (smaller = more compact)
    loggedWalls: new Set(), // Track which walls have been logged to prevent repetition
    firstWallLogged: false, // Track if first wall debug info has been logged

    // Note: Wall positions are now calculated dynamically based on actual texture dimensions
    // The old static groupConfigurations are no longer used

    // Legacy methods - no longer used for positioning but kept for compatibility
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

    createModelMatrix(groupId, aspectRatio = 1.0, allTextureData = []) {
        const matrix = new Matrix4();

        // RENDER ALL FOUR WALLS - COMPLETE RECTANGULAR ROOM
        if (groupId !== 1 && groupId !== 2 && groupId !== 3 && groupId !== 4) {
            // Skip all walls except the four main walls
            return new Matrix4().scale(0, 0, 0).elements; // Make invisible
        }

        let position, rotation, scaleX, scaleY;

        if (allTextureData.length >= 1) {
            // Find the current wall texture data
            const currentWall = allTextureData.find(tex => tex.id === groupId);
            if (!currentWall) {
                console.warn(`Wall ${groupId} texture data not found`);
                position = [0, 0, 0];
                rotation = [0, 0, 0];
                scaleX = 1;
                scaleY = 1;
            } else {
                // Use actual pixel dimensions converted to WebGL coordinates
                const pixelToWebGLScale = this.pixelToWebGLScale;
                const width = currentWall.width * pixelToWebGLScale;
                const height = currentWall.height * pixelToWebGLScale;

                // Set scale correctly: base geometry is 2 units wide (-1 to +1)
                // So to get desired width, we scale by width/2
                scaleX = width / 2;  // Scale from 2 units to desired width
                scaleY = height / 2; // Scale from 2 units to desired height

                // Get wall dimensions for sequential positioning
                const firstWall = allTextureData.find(tex => tex.id === 1);
                const secondWall = allTextureData.find(tex => tex.id === 2);
                const thirdWall = allTextureData.find(tex => tex.id === 3);
                const firstWallWidth = firstWall ? firstWall.width * pixelToWebGLScale : 0;
                const secondWallWidth = secondWall ? secondWall.width * pixelToWebGLScale : 0;
                const thirdWallWidth = thirdWall ? thirdWall.width * pixelToWebGLScale : 0;

                let startCoord, endCoord;

                // SEQUENTIAL WALL POSITIONING
                if (groupId === 1) {
                    // FIRST WALL: Start at origin
                    position = [width/2, 0, 0]; // Position center at half-width
                    rotation = [0, 0, 0]; // Face towards camera (towards negative Z)

                    startCoord = [0, 0, 0]; // Wall left edge at origin
                    endCoord = [width, 0, 0]; // Wall right edge at width along X-axis

                } else if (groupId === 2) {
                    // SECOND WALL: Start at end of first wall, extend perpendicular
                    // First wall ends at [firstWallWidth, 0, 0]
                    // Second wall should extend from there in Z direction
                    position = [firstWallWidth, 0, width/2]; // Position at first wall's end + half current width in Z
                    rotation = [0, Math.PI/2, 0]; // Rotate 90° to face left (perpendicular to first wall)

                    startCoord = [firstWallWidth, 0, 0]; // Wall starts at end of first wall
                    endCoord = [firstWallWidth, 0, width]; // Wall extends in Z direction

                } else if (groupId === 3) {
                    // THIRD WALL: Start at end of second wall, extend back towards origin
                    // Second wall ends at [firstWallWidth, 0, secondWallWidth]
                    // Third wall should extend from there back along negative X direction
                    position = [firstWallWidth - width/2, 0, secondWallWidth]; // Position at second wall's end - half current width in X
                    rotation = [0, Math.PI, 0]; // Rotate 180° to face back (opposite to first wall)

                    startCoord = [firstWallWidth, 0, secondWallWidth]; // Wall starts at end of second wall
                    endCoord = [firstWallWidth - width, 0, secondWallWidth]; // Wall extends back along X-axis

                } else if (groupId === 4) {
                    // FOURTH WALL: Start at end of third wall, extend back to origin to close the rectangle
                    // Third wall ends at [firstWallWidth - thirdWallWidth, 0, secondWallWidth]
                    // Fourth wall should extend from there back along negative Z direction to close the loop
                    position = [firstWallWidth - thirdWallWidth, 0, secondWallWidth - width/2]; // Position at third wall's end - half current width in Z
                    rotation = [0, -Math.PI/2, 0]; // Rotate -90° to face right (perpendicular to third wall)

                    startCoord = [firstWallWidth - thirdWallWidth, 0, secondWallWidth]; // Wall starts at end of third wall
                    endCoord = [firstWallWidth - thirdWallWidth, 0, secondWallWidth - width]; // Wall extends back towards origin along Z-axis
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
                    if (groupId === 1) {
                        console.log(`First wall extends along X-axis from origin`);
                    } else if (groupId === 2) {
                        console.log(`Second wall extends along Z-axis, perpendicular to first`);
                    } else if (groupId === 3) {
                        console.log(`Third wall extends back along X-axis, perpendicular to second`);
                    } else if (groupId === 4) {
                        console.log(`Fourth wall extends back along Z-axis to close the rectangular room`);
                    }
                    console.log('========================');
                    this.loggedWalls.add(groupId);
                }
            }
        } else {
            // Fallback
            position = [0, 0, 0];
            rotation = [0, 0, 0];
            scaleX = 1;
            scaleY = 1;
        }

        matrix.identity()
              .translate(position[0], position[1], position[2])
              .rotateX(rotation[0])
              .rotateY(rotation[1])
              .rotateZ(rotation[2])
              .scale(scaleX, scaleY, 1);

        return matrix.elements;
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
        this.loggedWalls.clear(); // Clear logged walls to see new positioning
        this.firstWallLogged = false; // Reset first wall logging
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
            case 1: return [0, 0, 0]; // First wall starts at origin
            case 2: return [wallWidths[0], 0, 0]; // Second wall starts at end of first
            case 3: return [wallWidths[0], 0, wallWidths[1]]; // Third wall starts at end of second
            case 4: return [0, 0, wallWidths[1]]; // Fourth wall starts at end of third
            default: return [0, 0, 0];
        }
    },

    calculateWallEndEdge(groupId, wallWidths) {
        // Calculate where each wall ends based on sequential connection
        switch(groupId) {
            case 1: return [wallWidths[0], 0, 0]; // First wall ends at its width
            case 2: return [wallWidths[0], 0, wallWidths[1]]; // Second wall ends at its width in Z
            case 3: return [0, 0, wallWidths[1]]; // Third wall ends back at X=0
            case 4: return [0, 0, 0]; // Fourth wall closes the loop back to origin
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