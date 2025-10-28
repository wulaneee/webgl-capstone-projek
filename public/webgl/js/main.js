class PanoramaLauncher {
    constructor() {
        this.detectButton = null;
        this.startButton = null;
        this.loadingStatus = null;
        this.errorStatus = null;
        this.imagePreviewSection = null;
        this.imagePreviewGrid = null;
        this.imageCount = null;

        this.detectedImages = [];

        this.init();
    }

    init() {
        this.detectButton = document.getElementById('detectButton');
        this.startButton = document.getElementById('startButton');
        this.loadingStatus = document.getElementById('loadingStatus');
        this.errorStatus = document.getElementById('errorStatus');
        this.imagePreviewSection = document.getElementById('imagePreviewSection');
        this.imagePreviewGrid = document.getElementById('imagePreviewGrid');
        this.imageCount = document.getElementById('imageCount');

        if (!this.detectButton || !this.startButton) {
            console.error('Required DOM elements not found');
            return;
        }

        this.detectButton.addEventListener('click', () => this.detectImages());
        this.startButton.addEventListener('click', () => this.openFullScreenViewer());

        console.log('PanoramaLauncher initialized');
    }

    async detectImages() {
        try {
            this.showLoading('Detecting images...');
            this.detectButton.disabled = true;

            console.log('=== Starting Image Detection ===');
            console.log('Detecting available images...');

            // First test if we can access the folder structure
            console.log('Testing direct image access...');

            // Test with actual file paths
            const testPaths = [
                'session_01/output/stitched_group_1.jpg',
                'session_01/output/stitched_group_2.jpg'
            ];

            console.log('Testing these paths:', testPaths);

            this.detectedImages = await TextureLoader.detectImages();

            console.log(`Detection complete. Found ${this.detectedImages.length} images:`, this.detectedImages);

            if (this.detectedImages.length === 0) {
                // Try to give more specific error information
                console.log('No images detected. Trying alternative detection...');

                // Manual fallback - create entries for known files
                const manualImages = [
                    { id: 1, filename: 'stitched_group_1.jpg', path: 'session_01/output/stitched_group_1.jpg' },
                    { id: 2, filename: 'stitched_group_2.jpg', path: 'session_01/output/stitched_group_2.jpg' }
                ];

                console.log('Trying manual image entries:', manualImages);

                // Test loading one manually
                try {
                    const testImg = new Image();
                    testImg.onload = () => {
                        console.log('✓ Manual test image loaded successfully');
                        this.detectedImages = manualImages;
                        this.displayImagePreviews();
                        this.hideLoading();
                        this.startButton.classList.remove('hidden');
                        this.detectButton.textContent = 'Refresh Images';
                        this.detectButton.disabled = false;
                    };
                    testImg.onerror = () => {
                        throw new Error('Cannot access image files. Please check file paths.');
                    };
                    testImg.src = manualImages[0].path;
                    return; // Exit here to wait for image load
                } catch (error) {
                    throw new Error('No stitched images found in session_01/output/. Please check that the files exist.');
                }
            }

            this.displayImagePreviews();
            this.hideLoading();

            this.startButton.classList.remove('hidden');
            this.detectButton.textContent = 'Refresh Images';
            this.detectButton.disabled = false;

        } catch (error) {
            console.error('Failed to detect images:', error);
            this.showError(error.message);
            this.detectButton.disabled = false;
        }
    }

    displayImagePreviews() {
        this.imagePreviewGrid.innerHTML = '';

        this.detectedImages.forEach(imageData => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';

            const img = document.createElement('img');
            img.src = imageData.path;
            img.alt = imageData.filename;
            img.onerror = () => {
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4=';
            };

            const title = document.createElement('div');
            title.className = 'image-title';
            title.textContent = imageData.filename;

            const info = document.createElement('div');
            info.className = 'image-info';
            info.textContent = `Group ID: ${imageData.id}`;

            imageItem.appendChild(img);
            imageItem.appendChild(title);
            imageItem.appendChild(info);

            this.imagePreviewGrid.appendChild(imageItem);
        });

        this.imageCount.textContent = this.detectedImages.length;
        this.imagePreviewSection.classList.remove('hidden');
    }

    openFullScreenViewer() {
        if (this.detectedImages.length === 0) {
            this.showError('No images detected. Please detect images first.');
            return;
        }

        console.log('Opening fullscreen WebGL viewer...');
        window.open('viewer.html', '_blank', 'width=1200,height=800,toolbar=no,menubar=no,scrollbars=no,resizable=yes,fullscreen=yes');
    }

    showLoading(message = 'Loading...') {
        this.loadingStatus.textContent = message;
        this.loadingStatus.classList.remove('hidden');
        this.errorStatus.classList.add('hidden');
    }

    hideLoading() {
        this.loadingStatus.classList.add('hidden');
    }

    showError(message) {
        this.errorStatus.textContent = `Error: ${message}`;
        this.errorStatus.classList.remove('hidden');
        this.loadingStatus.classList.add('hidden');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.panoramaLauncher = new PanoramaLauncher();
});