class Matrix4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.identity();
    }

    identity() {
        const te = this.elements;
        te[0] = 1; te[4] = 0; te[8] = 0;  te[12] = 0;
        te[1] = 0; te[5] = 1; te[9] = 0;  te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = 1; te[14] = 0;
        te[3] = 0; te[7] = 0; te[11] = 0; te[15] = 1;
        return this;
    }

    perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov * 0.5);
        const rangeInv = 1.0 / (near - far);

        const te = this.elements;
        te[0] = f / aspect;
        te[1] = 0;
        te[2] = 0;
        te[3] = 0;
        te[4] = 0;
        te[5] = f;
        te[6] = 0;
        te[7] = 0;
        te[8] = 0;
        te[9] = 0;
        te[10] = (far + near) * rangeInv;
        te[11] = -1;
        te[12] = 0;
        te[13] = 0;
        te[14] = (2 * far * near) * rangeInv;
        te[15] = 0;

        return this;
    }

    lookAt(eye, target, up) {
        const te = this.elements;

        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;

        z0 = eye[0] - target[0];
        z1 = eye[1] - target[1];
        z2 = eye[2] - target[2];

        len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;

        x0 = up[1] * z2 - up[2] * z1;
        x1 = up[2] * z0 - up[0] * z2;
        x2 = up[0] * z1 - up[1] * z0;

        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if (!len) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
        } else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }

        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;

        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if (!len) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }

        te[0] = x0;
        te[1] = y0;
        te[2] = z0;
        te[3] = 0;
        te[4] = x1;
        te[5] = y1;
        te[6] = z1;
        te[7] = 0;
        te[8] = x2;
        te[9] = y2;
        te[10] = z2;
        te[11] = 0;
        te[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
        te[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
        te[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
        te[15] = 1;

        return this;
    }

    translate(x, y, z) {
        const te = this.elements;
        te[12] += te[0] * x + te[4] * y + te[8] * z;
        te[13] += te[1] * x + te[5] * y + te[9] * z;
        te[14] += te[2] * x + te[6] * y + te[10] * z;
        te[15] += te[3] * x + te[7] * y + te[11] * z;
        return this;
    }

    rotateY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const te = this.elements;

        const m11 = te[0], m13 = te[8];
        const m21 = te[1], m23 = te[9];
        const m31 = te[2], m33 = te[10];
        const m41 = te[3], m43 = te[11];

        te[0] = c * m11 + s * m13;
        te[8] = c * m13 - s * m11;
        te[1] = c * m21 + s * m23;
        te[9] = c * m23 - s * m21;
        te[2] = c * m31 + s * m33;
        te[10] = c * m33 - s * m31;
        te[3] = c * m41 + s * m43;
        te[11] = c * m43 - s * m41;

        return this;
    }

    rotateX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const te = this.elements;

        const m12 = te[4], m13 = te[8];
        const m22 = te[5], m23 = te[9];
        const m32 = te[6], m33 = te[10];
        const m42 = te[7], m43 = te[11];

        te[4] = c * m12 - s * m13;
        te[8] = s * m12 + c * m13;
        te[5] = c * m22 - s * m23;
        te[9] = s * m22 + c * m23;
        te[6] = c * m32 - s * m33;
        te[10] = s * m32 + c * m33;
        te[7] = c * m42 - s * m43;
        te[11] = s * m42 + c * m43;

        return this;
    }

    rotateZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const te = this.elements;

        const m11 = te[0], m12 = te[4];
        const m21 = te[1], m22 = te[5];
        const m31 = te[2], m32 = te[6];
        const m41 = te[3], m42 = te[7];

        te[0] = c * m11 - s * m12;
        te[4] = s * m11 + c * m12;
        te[1] = c * m21 - s * m22;
        te[5] = s * m21 + c * m22;
        te[2] = c * m31 - s * m32;
        te[6] = s * m31 + c * m32;
        te[3] = c * m41 - s * m42;
        te[7] = s * m41 + c * m42;

        return this;
    }
}

class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.position = [0, 0, 5]; // Start outside looking at the room
        this.target = [0, 0, 0]; // Look at center of room
        this.up = [0, 1, 0];

        this.fov = Math.PI / 3; // Wider field of view
        this.near = 0.1;
        this.far = 100.0;

        // Track different mouse button states
        this.isLeftDragging = false;
        this.isMiddleDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Rotation controls (left mouse)
        this.yaw = 0;
        this.pitch = 0;
        this.rotationSensitivity = 0.003;

        // Pan controls (middle mouse)
        this.panSensitivity = 0.02;
        this.zoomSensitivity = 0.1;
        this.zoomDistance = 5;

        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();

        this.setupControls();
        this.updateCameraPosition();
    }

    setupControls() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));

        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    onMouseDown(event) {
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;

        if (event.button === 0) { // Left mouse button
            this.isLeftDragging = true;
        } else if (event.button === 1) { // Middle mouse button
            event.preventDefault(); // Prevent default middle mouse behavior
            this.isMiddleDragging = true;
        }
    }

    onMouseMove(event) {
        if (!this.isLeftDragging && !this.isMiddleDragging) return;

        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;

        if (this.isLeftDragging) {
            // Left mouse: Rotate camera around target (orbital controls)
            this.yaw += deltaX * this.rotationSensitivity;
            this.pitch -= deltaY * this.rotationSensitivity;

            // Limit pitch to prevent flipping
            this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

        } else if (this.isMiddleDragging) {
            // Middle mouse: Pan the target point (like Figma)
            const viewDir = [
                this.target[0] - this.position[0],
                this.target[1] - this.position[1],
                this.target[2] - this.position[2]
            ];

            // Calculate right vector for panning
            const right = [
                viewDir[1] * this.up[2] - viewDir[2] * this.up[1],
                viewDir[2] * this.up[0] - viewDir[0] * this.up[2],
                viewDir[0] * this.up[1] - viewDir[1] * this.up[0]
            ];

            const rightLen = Math.sqrt(right[0] * right[0] + right[1] * right[1] + right[2] * right[2]);
            if (rightLen > 0) {
                right[0] /= rightLen;
                right[1] /= rightLen;
                right[2] /= rightLen;
            }

            // Pan target point
            this.target[0] -= right[0] * deltaX * this.panSensitivity;
            this.target[1] += this.up[1] * deltaY * this.panSensitivity;
            this.target[2] -= right[2] * deltaX * this.panSensitivity;
        }

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;

        this.updateCameraPosition();
    }

    onMouseUp(event) {
        if (event.button === 0) {
            this.isLeftDragging = false;
        } else if (event.button === 1) {
            this.isMiddleDragging = false;
        }
    }

    onWheel(event) {
        event.preventDefault();

        // Zoom in/out by changing distance from target
        this.zoomDistance += event.deltaY * this.zoomSensitivity;
        this.zoomDistance = Math.max(0.5, Math.min(50, this.zoomDistance)); // Limit zoom range

        this.updateCameraPosition();
    }

    onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            this.isLeftDragging = true; // Touch acts like left mouse
            this.lastMouseX = event.touches[0].clientX;
            this.lastMouseY = event.touches[0].clientY;
        }
    }

    onTouchMove(event) {
        event.preventDefault();
        if (!this.isLeftDragging || event.touches.length !== 1) return;

        const deltaX = event.touches[0].clientX - this.lastMouseX;
        const deltaY = event.touches[0].clientY - this.lastMouseY;

        // Touch uses rotation controls like left mouse
        this.yaw += deltaX * this.rotationSensitivity;
        this.pitch -= deltaY * this.rotationSensitivity;

        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

        this.lastMouseX = event.touches[0].clientX;
        this.lastMouseY = event.touches[0].clientY;

        this.updateCameraPosition();
    }

    onTouchEnd() {
        this.isLeftDragging = false;
    }

    updateCameraPosition() {
        // Calculate camera position based on yaw, pitch, and distance from target
        const x = this.target[0] + Math.cos(this.pitch) * Math.sin(this.yaw) * this.zoomDistance;
        const y = this.target[1] + Math.sin(this.pitch) * this.zoomDistance;
        const z = this.target[2] + Math.cos(this.pitch) * Math.cos(this.yaw) * this.zoomDistance;

        this.position = [x, y, z];

        this.viewMatrix.lookAt(this.position, this.target, this.up);
    }

    getViewMatrix() {
        return this.viewMatrix.elements;
    }

    getProjectionMatrix() {
        const aspect = this.canvas.width / this.canvas.height;
        this.projectionMatrix.perspective(this.fov, aspect, this.near, this.far);
        return this.projectionMatrix.elements;
    }
}

window.Matrix4 = Matrix4;
window.Camera = Camera;