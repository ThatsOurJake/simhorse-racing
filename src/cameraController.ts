import * as THREE from 'three';

export const CameraMode = {
  ORBITAL: 'orbital',
  FOLLOW: 'follow',
  HORSE: 'horse'
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

  // Fixed orbital camera position
  private readonly ORBITAL_POSITION = new THREE.Vector3(0, 35, 45);
  private readonly ORBITAL_LOOKAT = new THREE.Vector3(0, 0, 0);

  // Camera offset configurations
  private readonly HORSE_VIEW_OFFSET = new THREE.Vector3(0, 2, -4);
  private readonly FOLLOW_CAM_HEIGHT = 5;
  private readonly FOLLOW_CAM_BEHIND_DISTANCE = 10; // Distance behind leader (easily adjustable)

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;

    // Set initial orbital camera position
    this.camera.position.copy(this.ORBITAL_POSITION);
    this.camera.lookAt(this.ORBITAL_LOOKAT);
  }

  public update(
    horsePositions: THREE.Vector3[],
    trackCenter: THREE.Vector3,
    getTrackPosition?: (progress: number, laneOffset?: number) => THREE.Vector3,
    leadHorseProgress?: number,
    horseProgressList?: number[]
  ): void {
    switch (this.currentMode) {
      case CameraMode.ORBITAL:
        this.updateOrbitalCamera();
        break;
      case CameraMode.FOLLOW:
        this.updateFollowCamera(horsePositions, trackCenter, getTrackPosition, leadHorseProgress);
        break;
      case CameraMode.HORSE:
        this.updateHorseCamera(horsePositions, getTrackPosition, horseProgressList);
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
    trackCenter: THREE.Vector3,
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

      // Calculate average position of all horses for better framing
      const avgHorsePos = new THREE.Vector3();
      horsePositions.forEach((pos) => avgHorsePos.add(pos));
      avgHorsePos.divideScalar(horsePositions.length);
      avgHorsePos.setY(1);

      // Look at the pack
      this.camera.lookAt(avgHorsePos);
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
    horseProgressList?: number[]
  ): void {
    if (this.selectedHorseIndex >= horsePositions.length) return;

    const horsePos = horsePositions[this.selectedHorseIndex];

    // If we have track position function and horse progress, follow the track
    if (getTrackPosition && horseProgressList && horseProgressList[this.selectedHorseIndex] !== undefined) {
      const horseProgress = horseProgressList[this.selectedHorseIndex];

      // Position camera BEHIND the horse by 4 units
      const cameraProgress = Math.max(0, horseProgress - 4);

      // Get camera position on track (center lane)
      const cameraTrackPos = getTrackPosition(cameraProgress);

      // Set camera position on track with height
      const cameraPosition = new THREE.Vector3(
        cameraTrackPos.x,
        2, // Height above ground
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

  public setMode(mode: CameraMode, horseIndex?: number): void {
    this.currentMode = mode;

    if (mode === CameraMode.HORSE && horseIndex !== undefined) {
      this.selectedHorseIndex = horseIndex;
    }
  }

  public getCurrentMode(): CameraMode {
    return this.currentMode;
  }

  public getSelectedHorseIndex(): number {
    return this.selectedHorseIndex;
  }
}
