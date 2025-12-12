import * as THREE from 'three';
import type { RaceTrackConfig } from './raceTrack';

export const CameraMode = {
  ORBITAL: 'orbital',
  FOLLOW: 'follow',
  HORSE: 'horse',
  FINISH_LINE: 'finishLine'
} as const;

export type CameraMode = typeof CameraMode[keyof typeof CameraMode];

export interface CameraTarget {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private currentMode: CameraMode = CameraMode.ORBITAL;
  private selectedHorseIndex: number = 0;
  private lockedHorseName: string | null = null; // Track specific horse by name when racing

  // Dynamic camera positions based on track config
  private readonly ORBITAL_POSITION: THREE.Vector3;
  private readonly ORBITAL_LOOKAT: THREE.Vector3;
  private readonly finishLineSideOffset: number;
  private readonly finishLineCameraHeight: number;
  private readonly trackWidth: number;

  // Camera offset configurations
  private readonly FOLLOW_CAM_HEIGHT = 5;
  private readonly FOLLOW_CAM_BEHIND_DISTANCE = 10; // Distance behind leader (easily adjustable)

  constructor(camera: THREE.PerspectiveCamera, trackConfig: RaceTrackConfig) {
    this.camera = camera;
    this.trackWidth = trackConfig.width;

    // Calculate orbital camera position based on track size
    // Position should be high enough to see the whole track
    const trackDiagonal = Math.sqrt(
      Math.pow(trackConfig.length, 2) +
      Math.pow((trackConfig.radius + trackConfig.width) * 2, 2)
    );
    const orbitalHeight = trackDiagonal * 0.6; // 60% of diagonal for closer view
    const orbitalDistance = trackDiagonal * 0.65; // 65% of diagonal for zoomed in angle
    this.ORBITAL_POSITION = new THREE.Vector3(0, orbitalHeight, orbitalDistance);
    this.ORBITAL_LOOKAT = new THREE.Vector3(0, 0, 0);

    // Calculate finish line camera settings based on track width
    this.finishLineSideOffset = trackConfig.width * 0.9; // 0.9x track width for closer side view
    this.finishLineCameraHeight = trackConfig.barrierHeight * 3.5; // 3.5x barrier height for elevated angle

    // Set initial orbital camera position
    this.camera.position.copy(this.ORBITAL_POSITION);
    this.camera.lookAt(this.ORBITAL_LOOKAT);
  }

  public update(
    horsePositions: THREE.Vector3[],
    _trackCenter: THREE.Vector3,
    getTrackPosition?: (progress: number, laneOffset?: number) => THREE.Vector3,
    leadHorseProgress?: number,
    horseProgressList?: number[],
    isRacing?: boolean,
    leaderboardOrder?: string[],
    horseNames?: string[]
  ): void {
    switch (this.currentMode) {
      case CameraMode.ORBITAL:
        this.updateOrbitalCamera();
        break;
      case CameraMode.FOLLOW:
        this.updateFollowCamera(horsePositions, getTrackPosition, leadHorseProgress);
        break;
      case CameraMode.HORSE:
        this.updateHorseCamera(horsePositions, getTrackPosition, horseProgressList, isRacing, leaderboardOrder, horseNames);
        break;
      case CameraMode.FINISH_LINE:
        this.updateFinishLineCamera(getTrackPosition);
        break;
    }
  }

  private updateOrbitalCamera(): void {
    // Fixed orbital view - smoothly transition to fixed position
    this.camera.position.lerp(this.ORBITAL_POSITION, 0.1);

    const currentLookAt = new THREE.Vector3();
    this.camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10).add(this.camera.position);
    currentLookAt.lerp(this.ORBITAL_LOOKAT, 0.1);
    this.camera.lookAt(currentLookAt);
  }

  private updateFollowCamera(
    horsePositions: THREE.Vector3[],
    getTrackPosition?: (progress: number, laneOffset?: number) => THREE.Vector3,
    leadHorseProgress?: number
  ): void {
    if (horsePositions.length === 0) return;

    // If we have track position function and lead horse progress, use proper track following
    if (getTrackPosition && leadHorseProgress !== undefined) {
      // Position camera AHEAD of the leader by the configured distance (to face them)
      const cameraProgress = leadHorseProgress + this.FOLLOW_CAM_BEHIND_DISTANCE;

      // Get camera position on track (center lane)
      const cameraTrackPos = getTrackPosition(cameraProgress);

      // Set camera position on track with height
      const cameraPosition = new THREE.Vector3(
        cameraTrackPos.x,
        this.FOLLOW_CAM_HEIGHT,
        cameraTrackPos.z
      );

      // Smooth camera movement
      this.camera.position.lerp(cameraPosition, 0.08);

      // Get the lead horse position (find the horse closest to leadHorseProgress)
      let leadHorsePos = horsePositions[0];
      if (horsePositions.length > 0) {
        // The horses aren't necessarily in order, so we need to find which one is actually leading
        // Since we only have positions, just look at the first horse (we could improve this)
        const leadPos = getTrackPosition(leadHorseProgress);
        leadHorsePos = new THREE.Vector3(leadPos.x, 1, leadPos.z);
      }

      // Look at the lead horse
      this.camera.lookAt(leadHorsePos);
    } else {
      // Fallback to simple behavior
      const leadHorse = horsePositions[0];
      const cameraPosition = new THREE.Vector3()
        .copy(leadHorse)
        .add(new THREE.Vector3(this.FOLLOW_CAM_BEHIND_DISTANCE, this.FOLLOW_CAM_HEIGHT, 0));

      this.camera.position.lerp(cameraPosition, 0.08);
      this.camera.lookAt(leadHorse);
    }
  }

  private updateHorseCamera(
    horsePositions: THREE.Vector3[],
    getTrackPosition?: (progress: number, laneOffset?: number) => THREE.Vector3,
    horseProgressList?: number[],
    isRacing?: boolean,
    leaderboardOrder?: string[],
    horseNames?: string[]
  ): void {
    // Determine which horse index to follow
    let actualHorseIndex = this.selectedHorseIndex;

    // During race, if we have a locked horse, find its current index
    if (isRacing && this.lockedHorseName && horseNames) {
      const lockedIndex = horseNames.findIndex(name => name === this.lockedHorseName);
      if (lockedIndex !== -1) {
        actualHorseIndex = lockedIndex;
      }
    }

    if (actualHorseIndex >= horsePositions.length) return;

    const horsePos = horsePositions[actualHorseIndex];

    // If we have track position function and horse progress, follow the track
    if (getTrackPosition && horseProgressList && horseProgressList[actualHorseIndex] !== undefined) {
      const horseProgress = horseProgressList[actualHorseIndex];

      // Position camera BEHIND the horse by 6 units (same as follow cam distance)
      const cameraProgress = Math.max(0, horseProgress - 6);

      // Get camera position on track (center lane, behind the horse)
      const cameraTrackPos = getTrackPosition(cameraProgress);

      // Set camera position on track with height
      const cameraPosition = new THREE.Vector3(
        cameraTrackPos.x,
        this.FOLLOW_CAM_HEIGHT, // Use same height as follow camera
        cameraTrackPos.z
      );

      // Smooth camera following
      this.camera.position.lerp(cameraPosition, 0.1);

      // Look at the horse at head height
      const lookAtPoint = new THREE.Vector3().copy(horsePos).setY(horsePos.y + 1);

      this.camera.lookAt(lookAtPoint);
    } else {
      // Fallback to simple offset
      const cameraOffset = new THREE.Vector3(
        -4, // Behind the horse
        2, // Height above horse
        0 // No side offset
      );

      const cameraPosition = new THREE.Vector3().copy(horsePos).add(cameraOffset);

      // Smooth camera following
      this.camera.position.lerp(cameraPosition, 0.1);

      // Look at the horse at head height
      const lookAtPoint = new THREE.Vector3().copy(horsePos).setY(horsePos.y + 1);

      this.camera.lookAt(lookAtPoint);
    }
  }

  private updateFinishLineCamera(
    getTrackPosition?: (progress: number, laneOffset?: number) => THREE.Vector3
  ): void {
    if (!getTrackPosition) return;

    // Get the finish line position (at progress 0, which is at the start of bottom straight)
    const finishLinePos = getTrackPosition(0, this.trackWidth / 2); // Center of track

    // Position camera to the side (along Z axis) for proper side-on view of finish line
    const cameraPosition = new THREE.Vector3(
      finishLinePos.x, // Align camera X position with finish line
      this.finishLineCameraHeight, // Height to see over barriers
      finishLinePos.z + this.finishLineSideOffset // Position to the side along Z
    );

    // Smooth camera movement
    this.camera.position.lerp(cameraPosition, 0.1);

    // Look at finish line with slight downward tilt (below horse height)
    const lookAtPosition = new THREE.Vector3(
      finishLinePos.x,
      0.8, // Below horse height for downward tilt
      finishLinePos.z
    );

    this.camera.lookAt(lookAtPosition);
  }

  public setMode(mode: CameraMode, horseIndex?: number, horseName?: string, isRacing?: boolean, leaderboardOrder?: string[]): void {
    this.currentMode = mode;

    if (mode === CameraMode.HORSE && horseIndex !== undefined) {
      this.selectedHorseIndex = horseIndex;

      // If racing, lock to the specific horse at this leaderboard position
      if (isRacing && leaderboardOrder && horseIndex < leaderboardOrder.length) {
        this.lockedHorseName = leaderboardOrder[horseIndex];
      } else if (horseName) {
        this.lockedHorseName = horseName;
      } else {
        this.lockedHorseName = null;
      }
    }

    // Reset locked horse when switching away from horse mode
    if (mode !== CameraMode.HORSE) {
      this.lockedHorseName = null;
    }
  }

  public getCurrentMode(): CameraMode {
    return this.currentMode;
  }

  public getSelectedHorseIndex(): number {
    return this.selectedHorseIndex;
  }
}
