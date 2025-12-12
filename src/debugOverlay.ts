export class DebugOverlay {
  private overlayElement: HTMLDivElement;
  private isVisible: boolean = true;

  constructor() {
    this.overlayElement = this.createOverlay();
    document.body.appendChild(this.overlayElement);
    this.show(); // Show by default
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '10px';
    overlay.style.left = '10px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.color = '#00ff00';
    overlay.style.padding = '15px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '14px';
    overlay.style.borderRadius = '5px';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'none';
    overlay.style.maxWidth = '400px';

    overlay.innerHTML = this.getOverlayContent();

    return overlay;
  }

  private getOverlayContent(): string {
    return `
      <div style="margin-bottom: 10px; font-size: 16px; font-weight: bold; color: #ffff00;">
        🎮 CONTROLS
      </div>
      <div style="line-height: 1.8;">
        <div style="margin-bottom: 8px; border-bottom: 1px solid #00ff00; padding-bottom: 5px;">
          <strong style="color: #00ffff;">Camera Controls:</strong>
        </div>
        <div style="margin-left: 10px;">
          <div><span style="color: #ffff00;">0</span> - Orbital View (Fixed overhead)</div>
          <div><span style="color: #ffff00;">9</span> - Follow Camera (Follows leader)</div>
          <div><span style="color: #ffff00;">-</span> - Finish Line View (Photo finish)</div>
          <div><span style="color: #ffff00;">1-8</span> - Horse View (Third-person)</div>
        </div>
        
        <div style="margin-top: 12px; margin-bottom: 8px; border-bottom: 1px solid #00ff00; padding-bottom: 5px;">
          <strong style="color: #00ffff;">Debug:</strong>
        </div>
        <div style="margin-left: 10px;">
          <div><span style="color: #ffff00;">D</span> - Toggle this overlay</div>
        </div>

        <div style="margin-top: 12px; margin-bottom: 8px; border-bottom: 1px solid #00ff00; padding-bottom: 5px;">
          <strong style="color: #00ffff;">Race Controls:</strong>
        </div>
        <div style="margin-left: 10px;">
          <div><span style="color: #ffff00;">E</span> - Toggle Horse Editor</div>
          <div><span style="color: #ffff00;">L</span> - Toggle Leaderboard</div>
          <div><span style="color: #ffff00;">P</span> - Start Race</div>
          <div><span style="color: #ffff00;">R</span> - Reset Race</div>
        </div>

        <div style="margin-top: 12px; margin-bottom: 8px; border-bottom: 1px solid #00ff00; padding-bottom: 5px;">
          <strong style="color: #00ffff;">Screens:</strong>
        </div>
        <div style="margin-left: 10px;">
          <div><span style="color: #ffff00;">Q</span> - Show Riders Roster (with odds)</div>
          <div><span style="color: #ffff00;">W</span> - Show Podium (top 3)</div>
          <div><span style="color: #ffff00;">A</span> - Return to Main View</div>
        </div>
      </div>
    `;
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.overlayElement.style.display = this.isVisible ? 'block' : 'none';
  }

  public show(): void {
    this.isVisible = true;
    this.overlayElement.style.display = 'block';
  }

  public hide(): void {
    this.isVisible = false;
    this.overlayElement.style.display = 'none';
  }

  public updateContent(content: string): void {
    this.overlayElement.innerHTML = content;
  }

  public addInfo(key: string, value: string): void {
    const infoDiv = document.createElement('div');
    infoDiv.style.marginTop = '5px';
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
