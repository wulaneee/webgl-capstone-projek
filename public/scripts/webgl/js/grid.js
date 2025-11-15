class Grid {
    static createGridGeometry(size = 10, divisions = 10) {
        const vertices = [];
        const step = size / divisions;
        const halfSize = size / 2;

        // Create grid lines parallel to X-axis (horizontal lines)
        for (let i = 0; i <= divisions; i++) {
            const z = -halfSize + (i * step);
            vertices.push(-halfSize, 0, z);  // Start point
            vertices.push(halfSize, 0, z);   // End point
        }

        // Create grid lines parallel to Z-axis (vertical lines)
        for (let i = 0; i <= divisions; i++) {
            const x = -halfSize + (i * step);
            vertices.push(x, 0, -halfSize);  // Start point
            vertices.push(x, 0, halfSize);   // End point
        }

        return new Float32Array(vertices);
    }

    static createAxisGeometry(size = 5) {
        const vertices = [
            // X-axis (red) - horizontal line
            0, 0, 0,
            size, 0, 0,

            // Z-axis (blue) - vertical line
            0, 0, 0,
            0, 0, size,

            // Y-axis (green) - up line
            0, 0, 0,
            0, size, 0
        ];

        return new Float32Array(vertices);
    }

    static setupGridBuffers(gl) {
        // Increased grid size to 50x50 with 50 divisions for full, complete squares
        // Each square will be 1 unit (50/50 = 1), covering a larger area
        const gridVertices = this.createGridGeometry(50, 50); // 50x50 grid with 50 divisions
        const axisVertices = this.createAxisGeometry(15);     // 15 unit axes (increased for visibility)

        const gridBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, gridVertices, gl.STATIC_DRAW);

        const axisBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);

        return {
            grid: {
                buffer: gridBuffer,
                vertexCount: gridVertices.length / 3
            },
            axis: {
                buffer: axisBuffer,
                vertexCount: axisVertices.length / 3
            }
        };
    }
}

window.Grid = Grid;