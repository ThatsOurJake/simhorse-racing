export interface LeaderboardEntry {
  position: number;
  name: string;
}

export class LeaderboardOverlay {
  private overlayElement: HTMLDivElement;
  private isVisible: boolean = true;
  private raceTime: number = 0;

  constructor() {
    this.overlayElement = this.createOverlay();
    document.body.appendChild(this.overlayElement);
    this.show();
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.id = 'leaderboard-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 15px 20px;
      font-family: monospace;
      font-size: 14px;
      border-radius: 8px;
      border: 2px solid #4ecdc4;
      z-index: 999;
      min-width: 200px;
      display: none;
    `;

    overlay.innerHTML = this.getOverlayContent();
    return overlay;
  }

  private getOverlayContent(): string {
    const minutes = Math.floor(this.raceTime / 60);
    const seconds = Math.floor(this.raceTime % 60);
    const milliseconds = Math.floor((this.raceTime % 1) * 1000);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;

    return `
      <div style="font-weight: bold; color: #4ecdc4; margin-bottom: 10px; font-size: 16px;">
        RACE TIME: ${timeStr}
      </div>
      <div id="leaderboard-entries" style="line-height: 1.8;">
        <div style="color: #888;">Waiting for race...</div>
      </div>
    `;
  }

  public update(raceTime: number, leaders: LeaderboardEntry[]): void {
    this.raceTime = raceTime;

    const minutes = Math.floor(raceTime / 60);
    const seconds = Math.floor(raceTime % 60);
    const milliseconds = Math.floor((raceTime % 1) * 1000);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;

    let entriesHtml = '';
    if (leaders.length === 0) {
      entriesHtml = '<div style="color: #888;">Waiting for race...</div>';
    } else {
      const positionColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
      const medals = ['🥇', '🥈', '🥉'];

      leaders.forEach((entry, index) => {
        const isTopThree = index < 3;
        const color = isTopThree ? positionColors[index] : '#aaa';
        const medal = isTopThree ? medals[index] + ' ' : '';
        const fontWeight = isTopThree ? 'bold' : 'normal';
        const fontSize = isTopThree ? '14px' : '13px';

        entriesHtml += `
          <div style="color: ${color}; font-weight: ${fontWeight}; font-size: ${fontSize};">
            ${medal}${entry.position}. ${entry.name}
          </div>
        `;
      });
    }

    this.overlayElement.innerHTML = `
      <div style="font-weight: bold; color: #4ecdc4; margin-bottom: 10px; font-size: 16px;">
        RACE TIME: ${timeStr}
      </div>
      <div id="leaderboard-entries" style="line-height: 1.8;">
        ${entriesHtml}
      </div>
    `;
  }

  public show(): void {
    this.isVisible = true;
    this.overlayElement.style.display = 'block';
  }

  public hide(): void {
    this.isVisible = false;
    this.overlayElement.style.display = 'none';
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public reset(): void {
    this.raceTime = 0;
    this.update(0, []);
  }

  public isShown(): boolean {
    return this.isVisible;
  }
}
