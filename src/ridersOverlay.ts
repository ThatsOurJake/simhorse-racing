import type { HorseData } from './horseStats';

export class RidersOverlay {
  private overlayElement: HTMLDivElement;
  private isVisible: boolean = false;

  constructor() {
    this.overlayElement = this.createOverlay();
    document.body.appendChild(this.overlayElement);
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.id = 'riders-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 30px;
      font-family: 'Arial', sans-serif;
      border-radius: 15px;
      border: 3px solid #4ecdc4;
      z-index: 1001;
      display: none;
      max-width: 900px;
      max-height: 90vh;
      overflow-y: auto;
    `;

    return overlay;
  }

  /**
   * Calculate win odds based on horse stats
   * Formula: weighted average of stats, normalized across all horses
   */
  private calculateOdds(horses: HorseData[]): Map<string, number> {
    const odds = new Map<string, number>();

    // Calculate weighted score for each horse
    // Speed is most important, then stamina, then acceleration
    const scores = horses.map((horse) => {
      const score = horse.stats.speed * 0.5 + horse.stats.stamina * 0.3 + horse.stats.acceleration * 0.2;
      return { id: horse.id, score };
    });

    // Calculate total score
    const totalScore = scores.reduce((sum, entry) => sum + entry.score, 0);

    // Convert to percentages
    scores.forEach((entry) => {
      const percentage = (entry.score / totalScore) * 100;
      odds.set(entry.id, percentage);
    });

    return odds;
  }

  public update(horses: HorseData[]): void {
    if (horses.length === 0) {
      this.overlayElement.innerHTML = `
        <div style="text-align: center;">
          <h2 style="color: #4ecdc4; margin-top: 0;">RIDERS ROSTER</h2>
          <p>No horses in race. Press 'E' to add horses.</p>
        </div>
      `;
      return;
    }

    const odds = this.calculateOdds(horses);

    // Sort horses by odds (descending)
    const sortedHorses = [...horses].sort((a, b) => {
      const oddsA = odds.get(a.id) ?? 0;
      const oddsB = odds.get(b.id) ?? 0;
      return oddsB - oddsA;
    });

    let html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4ecdc4; margin: 0 0 10px 0; font-size: 28px;">🏇 RIDERS ROSTER 🏇</h2>
        <p style="color: #999; margin: 0; font-size: 14px;">Press 'A' to return to race view</p>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
    `;

    sortedHorses.forEach((horse) => {
      const winOdds = odds.get(horse.id) ?? 0;
      const colorHex = '#' + horse.color.toString(16).padStart(6, '0');

      html += `
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid ${colorHex};
          border-radius: 10px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 15px;
        ">
          <div style="
            width: 50px;
            height: 50px;
            background: ${colorHex};
            border-radius: 8px;
            flex-shrink: 0;
          "></div>
          <div style="flex-grow: 1;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${horse.name}</div>
            <div style="font-size: 12px; color: #aaa; margin-bottom: 8px;">
              Speed: ${(horse.stats.speed * 100).toFixed(0)}% | 
              Stamina: ${(horse.stats.stamina * 100).toFixed(0)}% | 
              Accel: ${(horse.stats.acceleration * 100).toFixed(0)}%
            </div>
            <div style="
              font-size: 18px;
              font-weight: bold;
              color: #4ecdc4;
            ">
              ${winOdds.toFixed(1)}% to win
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;

    this.overlayElement.innerHTML = html;
  }

  public show(): void {
    this.isVisible = true;
    this.overlayElement.style.display = 'block';
  }

  public hide(): void {
    this.isVisible = false;
    this.overlayElement.style.display = 'none';
  }

  public isShown(): boolean {
    return this.isVisible;
  }

  public dispose(): void {
    document.body.removeChild(this.overlayElement);
  }
}
