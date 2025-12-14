import * as THREE from "three";
import {
  photoFinishModalHTML,
  photoFinishModalStyles,
  photoFinishThumbnailHTML,
  photoFinishThumbnailStyles,
} from "./overlays/overlayTemplates";

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
    getFinishLineCameraView: () => {
      position: THREE.Vector3;
      lookAt: THREE.Vector3;
    },
  ): void {
    // Create a temporary camera for the finish line view
    const tempCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    // Hide finish banner from photo finish (layer 1)
    tempCamera.layers.disable(1);

    // Get the finish line camera position and lookAt
    const finishView = getFinishLineCameraView();
    tempCamera.position.copy(finishView.position);
    tempCamera.lookAt(finishView.lookAt);

    // Render the scene from finish line camera
    renderer.render(scene, tempCamera);

    // Capture the canvas as an image
    this.capturedImageDataURL = renderer.domElement.toDataURL("image/png");

    // Update thumbnail if it exists
    if (this.thumbnailElement) {
      this.updateThumbnail();
    }
  }

  private createThumbnail(): void {
    this.thumbnailElement = document.createElement("div");
    this.thumbnailElement.id = "photo-finish-thumbnail";
    this.thumbnailElement.style.cssText = photoFinishThumbnailStyles;
    this.thumbnailElement.innerHTML = photoFinishThumbnailHTML;

    this.thumbnailElement.addEventListener("mouseenter", () => {
      if (this.thumbnailElement) {
        this.thumbnailElement.style.transform = "scale(1.05)";
      }
    });

    this.thumbnailElement.addEventListener("mouseleave", () => {
      if (this.thumbnailElement) {
        this.thumbnailElement.style.transform = "scale(1)";
      }
    });

    this.thumbnailElement.addEventListener("click", () => {
      this.showModal();
    });

    // Add context menu handler for saving
    this.thumbnailElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.downloadImage();
    });

    document.body.appendChild(this.thumbnailElement);
  }

  private createModal(): void {
    this.modalElement = document.createElement("div");
    this.modalElement.id = "photo-finish-modal";
    this.modalElement.style.cssText = photoFinishModalStyles;
    this.modalElement.innerHTML = photoFinishModalHTML;

    this.modalElement.addEventListener("click", (e) => {
      if (e.target === this.modalElement) {
        this.hideModal();
      }
    });

    // Add context menu handler for saving in modal
    this.modalElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.downloadImage();
    });

    document.body.appendChild(this.modalElement);

    // Handle ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modalElement?.style.display === "flex") {
        this.hideModal();
      }
    });
  }

  private updateThumbnail(): void {
    if (!this.thumbnailElement || !this.capturedImageDataURL) return;

    const img = this.thumbnailElement.querySelector(
      "#photo-finish-img",
    ) as HTMLImageElement;
    if (img) {
      img.src = this.capturedImageDataURL;
    }
  }

  private showModal(): void {
    if (!this.modalElement || !this.capturedImageDataURL) return;

    const img = this.modalElement.querySelector(
      "#photo-finish-modal-img",
    ) as HTMLImageElement;
    if (img) {
      img.src = this.capturedImageDataURL;
    }

    this.modalElement.style.display = "flex";
  }

  private hideModal(): void {
    if (!this.modalElement) return;
    this.modalElement.style.display = "none";
  }

  private downloadImage(): void {
    if (!this.capturedImageDataURL) return;

    const link = document.createElement("a");
    link.download = `photo-finish-${Date.now()}.png`;
    link.href = this.capturedImageDataURL;
    link.click();
  }

  public show(): void {
    if (this.thumbnailElement && this.capturedImageDataURL) {
      this.thumbnailElement.style.display = "block";
    }
  }

  public hide(): void {
    if (this.thumbnailElement) {
      this.thumbnailElement.style.display = "none";
    }
    this.hideModal();
  }

  public hasPhoto(): boolean {
    return this.capturedImageDataURL !== null;
  }

  public clear(): void {
    this.capturedImageDataURL = null;
    if (this.thumbnailElement) {
      this.thumbnailElement.style.display = "none";
    }
    this.hideModal();
  }
}
