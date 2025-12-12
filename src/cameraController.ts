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
    getTrackPosition?: (progress: number) => THREE.Vector3
  ): void {
    switch (this.currentMode) {
      case CameraMode.ORBITAL:
        this.updateOrbitalCamera();
        break;
      case CameraMode.FOLLOW:
        this.updateFollowCamera(horsePositions, trackCenter, getTrackPosition);
        break;
      case CameraMode.HORSE:
        this.updateHorseCamera(horsePositions);
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
    getTrackPosition?: (progress: number) => THREE.Vector3
  ): void {
    if (horsePositions.length === 0) return;

    // Find the leading horse (furthest along the track)
    let leadHorse = horsePositions[0];
    let minX = horsePositions[0].x;

    for (const pos of horsePositions) {
      if (pos.x < minX) {
        minX = pos.x;
        leadHorse = pos;
      }
    }

    // If we have a track position function, use it to follow the track path
    if (getTrackPosition) {
      // Calculate progress based on leader's X position (starts at -length/2)
      // This is a simplified progress - we'll enhance this later with proper track following
      const startX = -20; // Approximate start position
      const progress = Math.abs(leadHorse.x - startX);

      // Position camera behind the leader by the configured distance
      const cameraProgress = Math.max(0, progress - this.FOLLOW_CAM_BEHIND_DISTANCE);
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
      horsePositions.forEach(pos => avgHorsePos.add(pos));
      avgHorsePos.divideScalar(horsePositions.length);
      avgHorsePos.setY(1);

      // Look at the pack
      this.camera.lookAt(avgHorsePos);
    } else {
      // Fallback to simple behavior if no track function provided
      const cameraPosition = new THREE.Vector3()
        .copy(leadHorse)
        .add(new THREE.Vector3(this.FOLLOW_CAM_BEHIND_DISTANCE, this.FOLLOW_CAM_HEIGHT, 0));

      this.camera.position.lerp(cameraPosition, 0.08);
      this.camera.lookAt(leadHorse);
    }
  }

  private updateHorseCamera(horsePositions: THREE.Vector3[]): void {
    if (this.selectedHorseIndex >= horsePositions.length) return;

    const horsePos = horsePositions[this.selectedHorseIndex];

    // Horses move in +X direction (along the track from starting position)
    // So camera should be behind them in -X direction
    const cameraOffset = new THREE.Vector3(
      -4, // Behind the horse (opposite of +X movement)
      2,  // Height above horse
      0   // No side offset
    );

    const cameraPosition = new THREE.Vector3()
      .copy(horsePos)
      .add(cameraOffset);

    // Smooth camera following
    this.camera.position.lerp(cameraPosition, 0.1);

    // Look at the horse at head height
    const lookAtPoint = new THREE.Vector3()
      .copy(horsePos)
      .setY(horsePos.y + 1);

    this.camera.lookAt(lookAtPoint);
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
