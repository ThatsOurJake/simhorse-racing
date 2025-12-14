import { getCurrentTheme, saveTheme, type ThemeType } from "../themeConfig";
import { debugOverlayStyles, renderDebugContent } from "./overlayTemplates";

export class DebugOverlay {
  private overlayElement: HTMLDivElement;
  private isVisible: boolean = true;
  private onThemeChange?: (theme: ThemeType) => void;

  constructor() {
    this.overlayElement = this.createOverlay();
    document.body.appendChild(this.overlayElement);
    this.show(); // Show by default
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.id = "debug-overlay";

    // Apply styles
    overlay.style.cssText = debugOverlayStyles;

    this.updateOverlayContent(overlay);

    return overlay;
  }

  private updateOverlayContent(overlay: HTMLDivElement): void {
    const currentTheme = getCurrentTheme();
    overlay.innerHTML = renderDebugContent(currentTheme);

    // Attach theme toggle event listener
    const themeToggle = overlay.querySelector("#themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const newTheme: ThemeType =
          getCurrentTheme() === "normal" ? "christmas" : "normal";
        saveTheme(newTheme);
        this.updateOverlayContent(overlay);
        if (this.onThemeChange) {
          this.onThemeChange(newTheme);
        }
      });
    }
  }

  public setThemeChangeCallback(callback: (theme: ThemeType) => void): void {
    this.onThemeChange = callback;
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.overlayElement.style.display = this.isVisible ? "block" : "none";
  }

  public show(): void {
    this.isVisible = true;
    this.overlayElement.style.display = "block";
  }

  public hide(): void {
    this.isVisible = false;
    this.overlayElement.style.display = "none";
  }

  public updateContent(content: string): void {
    this.overlayElement.innerHTML = content;
  }

  public addInfo(key: string, value: string): void {
    const infoDiv = document.createElement("div");
    infoDiv.style.marginTop = "5px";
    infoDiv.innerHTML = `<span style="color: #ffff00;">${key}:</span> ${value}`;
    this.overlayElement.appendChild(infoDiv);
  }

  public isShowing(): boolean {
    return this.isVisible;
  }

  public dispose(): void {
    document.body.removeChild(this.overlayElement);
  }
}
