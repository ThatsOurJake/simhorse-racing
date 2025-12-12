import type { HorseData } from './horseStats';
import { ridersOverlayStyles, renderRidersContent, type RiderData } from './overlayTemplates';

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
    overlay.style.cssText = ridersOverlayStyles;
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

    // Convert to RiderData format
    const ridersData: RiderData[] = sortedHorses.map((horse) => ({
      name: horse.name,
      color: horse.color,
      speed: horse.stats.speed,
      stamina: horse.stats.stamina,
      acceleration: horse.stats.acceleration,
      winProbability: (odds.get(horse.id) ?? 0) / 100,
    }));

    this.overlayElement.innerHTML = renderRidersContent(ridersData);
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
