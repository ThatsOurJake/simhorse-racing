import * as THREE from 'three';
import type { HorseData } from './horseStats';
import { ridersOverlayStyles, renderRidersContent, type RiderData } from './overlayTemplates';
import { createHat, createFace } from './horseAccessories';

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
   * Generate a preview image of a horse with its accessories
   */
  private generateHorsePreview(horse: HorseData): string {
    // Create temporary scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 1, 3);
    camera.lookAt(0, 0, 0);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Create horse cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: horse.color });
    const horseMesh = new THREE.Mesh(geometry, material);
    horseMesh.rotation.y = 0; // Face forward
    scene.add(horseMesh);

    // Add hat
    const hat = createHat(horse.hat, horse.color);
    horseMesh.add(hat);

    // Add face
    const faceAccessories = createFace(horse.face, horseMesh);
    faceAccessories.forEach(accessory => horseMesh.add(accessory));

    // Create renderer
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(256, 256);
    renderer.setClearColor(0x000000, 1);

    // Render
    renderer.render(scene, camera);

    // Convert to data URL
    const dataURL = canvas.toDataURL('image/png');

    // Cleanup
    geometry.dispose();
    material.dispose();
    renderer.dispose();

    return dataURL;
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
        <div style="
          background: rgba(0, 0, 0, 0.95);
          color: white;
          padding: 30px;
          border-radius: 12px;
          max-width: 600px;
          text-align: center;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        ">
          <h1 style="margin: 0 0 20px 0; font-size: 32px; color: #4ecdc4;">
            🎄 RIDERS ROSTER 🎄
          </h1>
          <p style="font-size: 16px; color: #aaa; margin-bottom: 10px;">
            No horses in race.
          </p>
          <p style="font-size: 14px; color: #888; margin-bottom: 30px;">
            Return to the main track and press <span style="color: #4ecdc4; font-weight: bold;">E</span> to open the horse editor.
          </p>
          <div style="text-align: center; color: #888; font-size: 14px; padding-top: 20px; border-top: 1px solid #333;">
            Press <span style="color: #4ecdc4; font-weight: bold;">A</span> to close and return to track
          </div>
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
      previewImage: this.generateHorsePreview(horse),
    }));

    this.overlayElement.innerHTML = renderRidersContent(ridersData);
  }

  public show(): void {
    this.isVisible = true;
    this.overlayElement.style.display = 'flex';
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
