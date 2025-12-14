import * as THREE from "three";
import { CountdownOverlay } from "./countdownOverlay";
import { createFace, createHat } from "./horseAccessories";
import type { HorseData, SpeedPoint } from "./horseStats";
import { calculateSpeedCurve } from "./horseStats";
import type { RaceTrack } from "./raceTrack";

export const RaceState = {
  IDLE: "idle",
  COUNTDOWN: "countdown",
  RACING: "racing",
  FINISHED: "finished",
} as const;

export type RaceState = (typeof RaceState)[keyof typeof RaceState];

export interface Horse {
  mesh: THREE.Mesh;
  progress: number; // Distance traveled along track
  currentSpeed: number; // Current speed (from speed curve)
  speedCurve: SpeedPoint[]; // Pre-calculated speed curve
  hasFinished: boolean;
  finishTime: number | null; // Time when horse finished (null if not finished)
  finishSpeed: number; // Speed when crossing finish line (for smooth deceleration)
  laneOffset: number; // Offset from inner edge of track
  data: HorseData; // Reference to horse data
  speedVariance: number; // Current speed variance multiplier (0.85-1.15)
  varianceTimer: number; // Time until next variance change
  finalKick: number; // Random final stretch boost (0.8-1.2)
}

export class RaceManager {
  private state: RaceState = RaceState.IDLE;
  private horses: Horse[] = [];
  private countdownOverlay: CountdownOverlay;
  private raceTrack: RaceTrack;
  private trackLength: number;
  private raceSeed: number = 0; // For seeded randomness
  private raceTime: number = 0; // Current race time in seconds
  private readonly DECELERATION_DISTANCE = 30; // Distance to decelerate after finish line
  private photoFinishCaptured: boolean = false; // Track if photo has been captured this race
  private onPhotoFinishTrigger?: () => void; // Callback for photo capture

  constructor(raceTrack: RaceTrack) {
    this.raceTrack = raceTrack;
    this.countdownOverlay = new CountdownOverlay();

    // Calculate track length for one lap
    const config = raceTrack.getConfig();
    this.trackLength = config.length * 2 + Math.PI * config.radius * 2;
  }

  public setHorses(horseDataList: HorseData[], raceSeed?: number): void {
    // Clear existing horses from scene
    this.horses.forEach((horse) => {
      if (horse.mesh.parent) {
        horse.mesh.parent.remove(horse.mesh);
        // Also remove name label if it exists
        if (horse.mesh.userData.nameLabel?.parent) {
          horse.mesh.userData.nameLabel.parent.remove(
            horse.mesh.userData.nameLabel,
          );
        }
      }
    });

    this.horses = [];
    if (raceSeed !== undefined) {
      this.raceSeed = raceSeed;
    }

    // Create new horses
    const trackWidth = this.raceTrack.getConfig().width;
    const numHorses = horseDataList.length;
    const laneSpacing = trackWidth / (numHorses + 1);

    horseDataList.forEach((horseData, index) => {
      const laneOffset = laneSpacing * (index + 1);
      const speedCurve = calculateSpeedCurve(horseData, this.trackLength);

      // Create cube for horse
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({
        color: horseData.color,
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Rotate horse 90 degrees right so front faces forward along track
      mesh.rotation.y = Math.PI / 2;

      // Add hat accessory
      const hat = createHat(horseData.hat, horseData.color);
      mesh.add(hat);

      // Add face accessory
      const faceAccessories = createFace(horseData.face, mesh);
      faceAccessories.forEach((accessory) => {
        mesh.add(accessory);
      });

      // Create name label using canvas texture
      const nameLabel = this.createNameLabel(horseData.name);
      mesh.userData.nameLabel = nameLabel;

      // Generate final kick using race seed
      const finalKick =
        this.seededRandom(this.raceSeed + index * 7) * 0.4 + 0.8; // 0.8-1.2

      this.horses.push({
        mesh,
        progress: 0,
        currentSpeed: speedCurve[0].speed,
        speedCurve,
        hasFinished: false,
        finishTime: null,
        finishSpeed: 0,
        laneOffset,
        data: horseData,
        speedVariance: 1.0,
        varianceTimer: 0,
        finalKick,
      });

      // Add to scene
      const trackGroup = this.raceTrack.getGroup();
      if (trackGroup.parent) {
        trackGroup.parent.add(mesh);
        trackGroup.parent.add(nameLabel);
      }
    });

    // Position horses at starting line
    this.resetHorses();
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private createNameLabel(name: string): THREE.Sprite {
    // Create canvas for text
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

    // Set up text style first to measure
    context.font = "bold 32px Arial";
    const metrics = context.measureText(name);
    const textWidth = metrics.width;
    const padding = 20; // Padding on each side

    // Set canvas dimensions based on text width
    canvas.width = textWidth + padding * 2;
    canvas.height = 64;

    // Re-apply text style after resizing canvas
    context.font = "bold 32px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Draw background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.fillStyle = "#ffffff";
    context.fillText(name, canvas.width / 2, canvas.height / 2);

    // Create sprite from canvas texture
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    // Scale width proportionally to canvas width (base scale is for 256px width = 2 units)
    const widthScale = (canvas.width / 256) * 2;
    sprite.scale.set(widthScale, 0.5, 1);

    return sprite;
  }

  public async startRace(): Promise<void> {
    if (this.state !== RaceState.IDLE) {
      return; // Race already in progress
    }

    // Reset all horses and race time
    this.resetHorses();
    this.raceTime = 0;

    // Start countdown
    this.state = RaceState.COUNTDOWN;
    await this.countdownOverlay.showCountdown(["3", "2", "1", "GO"]);

    // Start racing
    this.state = RaceState.RACING;
  }

  private resetHorses(): void {
    this.horses.forEach((horse) => {
      horse.progress = 0;
      horse.hasFinished = false;
      horse.finishTime = null;
      horse.finishSpeed = 0;
      horse.currentSpeed = horse.speedCurve[0].speed;
      horse.speedVariance = 1.0;
      horse.varianceTimer = 0;

      // Position at starting line
      const position = this.raceTrack.getTrackPosition(0, horse.laneOffset);
      horse.mesh.position.x = position.x;
      horse.mesh.position.y = position.y + 0.5;
      horse.mesh.position.z = position.z;

      // Update name label position (above horse)
      if (horse.mesh.userData.nameLabel) {
        const nameLabel = horse.mesh.userData.nameLabel as THREE.Sprite;
        nameLabel.position.x = position.x;
        nameLabel.position.y = position.y + 2.2; // Position above horse and hat
        nameLabel.position.z = position.z;
      }
    });
  }

  public update(deltaTime: number): void {
    if (this.state !== RaceState.RACING && this.state !== RaceState.FINISHED) {
      return;
    }

    // Update race time (only during racing, not after finished)
    if (this.state === RaceState.RACING) {
      this.raceTime += deltaTime;
    }

    let allFinished = true;

    // Check for photo finish trigger (when leader crosses the finish line)
    if (!this.photoFinishCaptured && this.state === RaceState.RACING) {
      const leadProgress = this.getLeadHorseProgress();

      if (leadProgress >= this.trackLength) {
        this.photoFinishCaptured = true;
        if (this.onPhotoFinishTrigger) {
          this.onPhotoFinishTrigger();
        }
      }
    }

    // Update each horse
    this.horses.forEach((horse, horseIndex) => {
      if (!horse.hasFinished) {
        // Get base speed from speed curve
        const baseSpeed = this.getSpeedAtDistance(
          horse.speedCurve,
          horse.progress,
        );

        // Update variance timer
        horse.varianceTimer -= deltaTime;
        if (horse.varianceTimer <= 0) {
          // Time to change variance - happens every 1-3 seconds
          horse.varianceTimer =
            1 +
            this.seededRandom(this.raceSeed + horseIndex + horse.progress) * 2;

          // Calculate new variance based on stamina (high stamina = more consistent)
          const staminaConsistency = horse.data.stats.stamina;
          const varianceRange = 0.15 * (1 - staminaConsistency * 0.5); // 0.075-0.15 range
          const randomFactor = this.seededRandom(
            this.raceSeed + horseIndex + horse.progress + 1000,
          );
          horse.speedVariance = 1.0 + (randomFactor - 0.5) * 2 * varianceRange;
        }

        // Apply variance
        let finalSpeed = baseSpeed * horse.speedVariance;

        // Check if in final stretch (last 15% of track)
        const progressRatio = horse.progress / this.trackLength;
        if (progressRatio > 0.85) {
          // Apply final kick modifier
          const finalStretchBoost =
            1.0 + (horse.finalKick - 1.0) * ((progressRatio - 0.85) / 0.15);
          finalSpeed *= finalStretchBoost;
        }

        horse.currentSpeed = finalSpeed;
      }

      // Check if horse has already finished and is decelerating
      if (horse.hasFinished) {
        const distancePastFinish = horse.progress - this.trackLength;
        if (distancePastFinish < this.DECELERATION_DISTANCE) {
          // Use ease-out curve for smooth deceleration (quadratic ease-out for gentler slowdown)
          const t = distancePastFinish / this.DECELERATION_DISTANCE;
          const easeOut = 1 - (1 - t) ** 2; // Quadratic ease-out (gentler than cubic)

          // Interpolate from finish speed to 0
          horse.currentSpeed = horse.finishSpeed * (1 - easeOut);
        } else {
          // Stop completely after deceleration distance
          horse.currentSpeed = 0;
        }
      }

      // Move horse forward once per frame
      horse.progress += horse.currentSpeed * deltaTime;

      // Check if just crossed finish line this frame
      if (horse.progress >= this.trackLength && !horse.hasFinished) {
        horse.hasFinished = true;
        horse.finishTime = this.raceTime;
        horse.finishSpeed = horse.currentSpeed; // Store speed at finish for smooth deceleration
      }

      // Track if all horses have finished
      if (!horse.hasFinished) {
        allFinished = false;
      }

      // Update horse position based on progress and lane
      const position = this.raceTrack.getTrackPosition(
        horse.progress,
        horse.laneOffset,
      );
      horse.mesh.position.x = position.x;
      horse.mesh.position.y = position.y + 0.5; // Keep horse above ground
      horse.mesh.position.z = position.z;

      // Calculate forward direction for rotation
      // Sample a point slightly ahead to determine facing direction
      const lookAheadDistance = 0.1; // Small distance ahead
      const futurePosition = this.raceTrack.getTrackPosition(
        horse.progress + lookAheadDistance,
        horse.laneOffset,
      );
      const direction = new THREE.Vector3()
        .subVectors(futurePosition, position)
        .normalize();

      // Calculate rotation to face the direction of travel
      // atan2 gives us the angle in the XZ plane
      const targetRotation = Math.atan2(direction.x, direction.z);
      horse.mesh.rotation.y = targetRotation;

      // Update name label position (above horse)
      if (horse.mesh.userData.nameLabel) {
        const nameLabel = horse.mesh.userData.nameLabel as THREE.Sprite;
        nameLabel.position.x = position.x;
        nameLabel.position.y = position.y + 2.2; // Position above horse and hat
        nameLabel.position.z = position.z;
      }
    });

    // Check if race should transition to finished (all crossed line)
    if (allFinished && this.state === RaceState.RACING) {
      this.state = RaceState.FINISHED;
    }
  }

  private getSpeedAtDistance(
    speedCurve: SpeedPoint[],
    distance: number,
  ): number {
    // Find the two points that bracket the current distance
    for (let i = 0; i < speedCurve.length - 1; i++) {
      if (
        distance >= speedCurve[i].distance &&
        distance <= speedCurve[i + 1].distance
      ) {
        // Linear interpolation between the two points
        const t =
          (distance - speedCurve[i].distance) /
          (speedCurve[i + 1].distance - speedCurve[i].distance);
        return (
          speedCurve[i].speed +
          (speedCurve[i + 1].speed - speedCurve[i].speed) * t
        );
      }
    }

    // If beyond the curve, return the last speed
    return speedCurve[speedCurve.length - 1].speed;
  }

  public getState(): RaceState {
    return this.state;
  }

  public isRacing(): boolean {
    return (
      this.state === RaceState.RACING || this.state === RaceState.COUNTDOWN
    );
  }

  public resetRace(): void {
    this.state = RaceState.IDLE;
    this.raceTime = 0;
    this.photoFinishCaptured = false; // Reset photo capture flag
    this.resetHorses();
  }

  public stopRace(): void {
    // Stop the race immediately and set to finished state
    this.state = RaceState.FINISHED;
  }

  public getHorses(): Horse[] {
    return this.horses;
  }

  public getLeadHorseProgress(): number {
    if (this.horses.length === 0) return 0;

    // Find the horse with the most progress
    let maxProgress = 0;
    this.horses.forEach((horse) => {
      if (horse.progress > maxProgress) {
        maxProgress = horse.progress;
      }
    });

    return maxProgress;
  }

  public getHorseProgressList(): number[] {
    return this.horses.map((horse) => horse.progress);
  }

  public getRaceTime(): number {
    return this.raceTime;
  }

  public getLeaderboard(): {
    position: number;
    name: string;
    progress: number;
  }[] {
    // Sort horses: finished horses by finish time (ascending), then unfinished by progress (descending)
    const sorted = [...this.horses]
      .map((horse) => ({
        name: horse.data.name,
        progress: horse.progress,
        hasFinished: horse.hasFinished,
        finishTime: horse.finishTime,
      }))
      .sort((a, b) => {
        // Finished horses come first, sorted by finish time
        if (a.hasFinished && b.hasFinished) {
          return (a.finishTime ?? 0) - (b.finishTime ?? 0);
        }
        if (a.hasFinished) return -1;
        if (b.hasFinished) return 1;
        // Unfinished horses sorted by progress
        return b.progress - a.progress;
      });

    // Add positions
    return sorted.map((entry, index) => ({
      position: index + 1,
      name: entry.name,
      progress: entry.progress,
    }));
  }

  public getTrackLength(): number {
    return this.trackLength;
  }

  public setPhotoFinishCallback(callback: () => void): void {
    this.onPhotoFinishTrigger = callback;
  }
}
