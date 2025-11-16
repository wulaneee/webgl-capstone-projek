class Geometry {
    static createPlane(width = 2.0, height = 2.0) {
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const vertices = [
            -halfWidth, -halfHeight, 0.0,
             halfWidth, -halfHeight, 0.0,
             halfWidth,  halfHeight, 0.0,
            -halfWidth,  halfHeight, 0.0
        ];

        const textureCoords = [
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ];

        const indices = [
            0, 1, 2,
            0, 2, 3
        ];

        return {
            vertices,
            textureCoords,
            indices,
            vertexCount: indices.length
        };
    }

    static createBuffers(gl, geometry) {
        const vertexBuffer = WebGLUtils.createBuffer(gl, geometry.vertices);
        const texCoordBuffer = WebGLUtils.createBuffer(gl, geometry.textureCoords);
        const indexBuffer = WebGLUtils.createIndexBuffer(gl, geometry.indices);

        return {
            vertex: vertexBuffer,
            texCoord: texCoordBuffer,
            index: indexBuffer,
            vertexCount: geometry.vertexCount
        };
    }

    static bindBuffers(gl, buffers, program) {
        const positionAttribute = gl.getAttribLocation(program, 'a_position');
        const texCoordAttribute = gl.getAttribLocation(program, 'a_texCoord');

        WebGLUtils.bindAttribute(gl, buffers.vertex, positionAttribute, 3);
        WebGLUtils.bindAttribute(gl, buffers.texCoord, texCoordAttribute, 2);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    }
}

window.Geometry = Geometry;