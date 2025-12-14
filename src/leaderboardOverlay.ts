import {
  leaderboardOverlayStyles,
  renderLeaderboardContent,
} from "./overlayTemplates";

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
    const overlay = document.createElement("div");
    overlay.id = "leaderboard-overlay";
    overlay.style.cssText = leaderboardOverlayStyles;
    overlay.innerHTML = renderLeaderboardContent(this.raceTime, []);
    return overlay;
  }

  public update(raceTime: number, leaders: LeaderboardEntry[]): void {
    this.raceTime = raceTime;
    this.overlayElement.innerHTML = renderLeaderboardContent(raceTime, leaders);
  }

  public show(): void {
    this.isVisible = true;
    this.overlayElement.style.display = "block";
  }

  public hide(): void {
    this.isVisible = false;
    this.overlayElement.style.display = "none";
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
    this.overlayElement.innerHTML = renderLeaderboardContent(0, []);
  }

  public isShown(): boolean {
    return this.isVisible;
  }
}
