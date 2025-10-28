const Shaders = {
    vertex: `
        attribute vec3 a_position;
        attribute vec2 a_texCoord;

        uniform mat4 u_modelMatrix;
        uniform mat4 u_viewMatrix;
        uniform mat4 u_projectionMatrix;

        varying vec2 v_texCoord;

        void main() {
            gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
            v_texCoord = a_texCoord;
        }
    `,

    fragment: `
        precision mediump float;

        uniform sampler2D u_texture;
        uniform float u_opacity;

        varying vec2 v_texCoord;

        void main() {
            vec4 texColor = texture2D(u_texture, v_texCoord);
            gl_FragColor = vec4(texColor.rgb, texColor.a * u_opacity);
        }
    `,

    // Grid coordinate plane shaders
    gridVertex: `
        attribute vec3 a_position;

        uniform mat4 u_modelMatrix;
        uniform mat4 u_viewMatrix;
        uniform mat4 u_projectionMatrix;

        void main() {
            gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
        }
    `,

    gridFragment: `
        precision mediump float;

        uniform vec3 u_color;
        uniform float u_opacity;

        void main() {
            gl_FragColor = vec4(u_color, u_opacity);
        }
    `
};

window.Shaders = Shaders;