import * as THREE from 'three';

export class PhotoFinish {
  private capturedImageDataURL: string | null = null;
  private thumbnailElement: HTMLDivElement | null = null;
  private modalElement: HTMLDivElement | null = null;

  constructor() {
    this.createThumbnail();
    this.createModal();
  }

  /**
   * Capture a photo from a specific camera view
   */
  public capture(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    getFinishLineCameraView: () => { position: THREE.Vector3; lookAt: THREE.Vector3 }
  ): void {
    // Create a temporary camera for the finish line view
    const tempCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Get the finish line camera position and lookAt
    const finishView = getFinishLineCameraView();
    tempCamera.position.copy(finishView.position);
    tempCamera.lookAt(finishView.lookAt);

    // Store current size
    const currentWidth = renderer.domElement.width;
    const currentHeight = renderer.domElement.height;

    // Render the scene from finish line camera
    renderer.render(scene, tempCamera);

    // Capture the canvas as an image
    this.capturedImageDataURL = renderer.domElement.toDataURL('image/png');

    // Update thumbnail if it exists
    if (this.thumbnailElement) {
      this.updateThumbnail();
    }

    console.log('Photo finish captured!');
  }

  private createThumbnail(): void {
    this.thumbnailElement = document.createElement('div');
    this.thumbnailElement.id = 'photo-finish-thumbnail';
    this.thumbnailElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 200px;
      height: 120px;
      background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
      border: 3px solid #fff;
      cursor: pointer;
      display: none;
      overflow: hidden;
      z-index: 1000;
      transition: transform 0.2s ease;
    `;

    this.thumbnailElement.innerHTML = `
      <div style="
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      ">
        <img id="photo-finish-img" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
        " />
      </div>
      <div style="
        position: absolute;
        bottom: 12px;
        left: 0;
        right: 0;
        text-align: center;
        color: #fff;
        font-family: 'Georgia', serif;
        font-size: 10px;
        font-style: italic;
        text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
        background: linear-gradient(transparent, rgba(0,0,0,0.5));
        padding: 8px 4px 4px;
      ">
        PHOTO FINISH
      </div>
    `;

    this.thumbnailElement.addEventListener('mouseenter', () => {
      if (this.thumbnailElement) {
        this.thumbnailElement.style.transform = 'scale(1.05)';
      }
    });

    this.thumbnailElement.addEventListener('mouseleave', () => {
      if (this.thumbnailElement) {
        this.thumbnailElement.style.transform = 'scale(1)';
      }
    });

    this.thumbnailElement.addEventListener('click', () => {
      this.showModal();
    });

    // Add context menu handler for saving
    this.thumbnailElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.downloadImage();
    });

    document.body.appendChild(this.thumbnailElement);
  }

  private createModal(): void {
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'photo-finish-modal';
    this.modalElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      cursor: pointer;
    `;

    this.modalElement.innerHTML = `
      <div style="
        position: relative;
        max-width: 90%;
        max-height: 90%;
        background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
        padding: 20px;
        border: 4px solid #fff;
      ">
        <img id="photo-finish-modal-img" style="
          display: block;
          max-width: calc(90vw - 80px);
          max-height: calc(90vh - 120px);
          object-fit: contain;
        " />
        <div style="
          text-align: center;
          color: #fff;
          font-family: 'Georgia', serif;
          font-size: 16px;
          font-style: italic;
          margin-top: 12px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        ">
          PHOTO FINISH
        </div>
        <div style="
          text-align: center;
          color: #aaa;
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          margin-top: 8px;
        ">
          Right-click to save • ESC or click outside to close
        </div>
      </div>
    `;

    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.hideModal();
      }
    });

    // Add context menu handler for saving in modal
    this.modalElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.downloadImage();
    });

    document.body.appendChild(this.modalElement);

    // Handle ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalElement?.style.display === 'flex') {
        this.hideModal();
      }
    });
  }

  private updateThumbnail(): void {
    if (!this.thumbnailElement || !this.capturedImageDataURL) return;

    const img = this.thumbnailElement.querySelector('#photo-finish-img') as HTMLImageElement;
    if (img) {
      img.src = this.capturedImageDataURL;
    }
  }

  private showModal(): void {
    if (!this.modalElement || !this.capturedImageDataURL) return;

    const img = this.modalElement.querySelector('#photo-finish-modal-img') as HTMLImageElement;
    if (img) {
      img.src = this.capturedImageDataURL;
    }

    this.modalElement.style.display = 'flex';
  }

  private hideModal(): void {
    if (!this.modalElement) return;
    this.modalElement.style.display = 'none';
  }

  private downloadImage(): void {
    if (!this.capturedImageDataURL) return;

    const link = document.createElement('a');
    link.download = `photo-finish-${Date.now()}.png`;
    link.href = this.capturedImageDataURL;
    link.click();
  }

  public show(): void {
    if (this.thumbnailElement && this.capturedImageDataURL) {
      this.thumbnailElement.style.display = 'block';
    }
  }

  public hide(): void {
    if (this.thumbnailElement) {
      this.thumbnailElement.style.display = 'none';
    }
    this.hideModal();
  }

  public hasPhoto(): boolean {
    return this.capturedImageDataURL !== null;
  }

  public clear(): void {
    this.capturedImageDataURL = null;
    if (this.thumbnailElement) {
      this.thumbnailElement.style.display = 'none';
    }
    this.hideModal();
  }
}
