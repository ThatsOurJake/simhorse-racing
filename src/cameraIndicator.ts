import type { CameraMode } from "./cameraController";

export class CameraIndicator {
  private overlayElement: HTMLDivElement;
  private isVisible: boolean = true;

  constructor() {
    this.overlayElement = this.createOverlay();
    document.body.appendChild(this.overlayElement);
    this.show();
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.id = "camera-indicator";
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 10px 15px;
      font-family: monospace;
      font-size: 13px;
      border-radius: 8px;
      border: 2px solid #ff6b6b;
      z-index: 999;
      min-width: 200px;
      display: block;
      text-align: center;
      font-weight: bold;
    `;
    overlay.innerHTML = this.getCameraDisplayText("orbital");
    return overlay;
  }

  private getCameraDisplayText(
    mode: CameraMode | "freeFly",
    horseName?: string,
  ): string {
    switch (mode) {
      case "orbital":
        return "📷 Orbital View";
      case "follow":
        return "📷 Follow Leader";
      case "horse":
        return horseName ? `📷 Spectating ${horseName}` : "📷 Horse View";
      case "finishLine":
        return "📷 Finish Line";
      case "freeFly":
        return "📷 Free Fly Camera";
      default:
        return "📷 Camera View";
    }
  }

  public update(mode: CameraMode | "freeFly", horseName?: string): void {
    this.overlayElement.innerHTML = this.getCameraDisplayText(mode, horseName);
  }

  public show(): void {
    this.isVisible = true;
    this.overlayElement.style.display = "block";
  }

  public hide(): void {
    this.isVisible = false;
    this.overlayElement.style.display = "none";
  }

  public isShown(): boolean {
    return this.isVisible;
  }

  public dispose(): void {
    document.body.removeChild(this.overlayElement);
  }
}
