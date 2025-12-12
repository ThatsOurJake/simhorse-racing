import * as THREE from 'three';
import { CountdownOverlay } from './countdownOverlay';
import { RaceTrack } from './raceTrack';

export const RaceState = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  FINISHED: 'finished'
} as const;

export type RaceState = typeof RaceState[keyof typeof RaceState];

export interface Horse {
  mesh: THREE.Mesh;
  progress: number; // Distance traveled along track
  speed: number; // Units per second
  hasFinished: boolean;
  laneOffset: number; // Offset from inner edge of track
}

export class RaceManager {
  private state: RaceState = RaceState.IDLE;
  private horses: Horse[] = [];
  private countdownOverlay: CountdownOverlay;
  private raceTrack: RaceTrack;
  private trackLength: number;
  private readonly SPEED = 10; // Units per second

  constructor(raceTrack: RaceTrack) {
    this.raceTrack = raceTrack;
    this.countdownOverlay = new CountdownOverlay();

    // Calculate track length for one lap
    const config = raceTrack.getConfig();
    this.trackLength = config.length * 2 + Math.PI * config.radius * 2;
  }

  public addHorse(mesh: THREE.Mesh, laneOffset: number): void {
    this.horses.push({
      mesh,
      progress: 0,
      speed: this.SPEED,
      hasFinished: false,
      laneOffset
    });
  }

  public async startRace(): Promise<void> {
    if (this.state !== RaceState.IDLE) {
      return; // Race already in progress
    }

    // Reset all horses
    this.resetHorses();

    // Start countdown
    this.state = RaceState.COUNTDOWN;
    await this.countdownOverlay.showCountdown(['3', '2', '1', 'GO']);

    // Start racing
    this.state = RaceState.RACING;
  }

  private resetHorses(): void {
    this.horses.forEach((horse) => {
      horse.progress = 0;
      horse.hasFinished = false;
    });
  }

  public update(deltaTime: number): void {
    if (this.state !== RaceState.RACING) {
      return;
    }

    let allFinished = true;

    // Update each horse
    this.horses.forEach((horse) => {
      if (!horse.hasFinished) {
        // Move horse forward
        horse.progress += horse.speed * deltaTime;

        // Check if finished lap
        if (horse.progress >= this.trackLength) {
          horse.progress = this.trackLength;
          horse.hasFinished = true;
        } else {
          allFinished = false;
        }

        // Update horse position based on progress and lane
        const position = this.raceTrack.getTrackPosition(horse.progress, horse.laneOffset);
        horse.mesh.position.x = position.x;
        horse.mesh.position.y = position.y + 0.5; // Keep horse above ground
        horse.mesh.position.z = position.z;
      }
    });

    // Check if race is finished
    if (allFinished) {
      this.state = RaceState.FINISHED;
      console.log('Race finished!');
    }
  }

  public getState(): RaceState {
    return this.state;
  }

  public isRacing(): boolean {
    return this.state === RaceState.RACING || this.state === RaceState.COUNTDOWN;
  }

  public resetRace(): void {
    this.state = RaceState.IDLE;
    this.resetHorses();

    // Position horses at starting positions
    const startingPositions = this.raceTrack.getStartingPositions(this.horses.length);
    this.horses.forEach((horse, index) => {
      if (startingPositions[index]) {
        horse.mesh.position.copy(startingPositions[index]);
      }
    });
  }

  public getHorses(): Horse[] {
    return this.horses;
  }

  public dispose(): void {
    this.countdownOverlay.dispose();
  }
}
