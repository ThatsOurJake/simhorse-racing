import * as THREE from 'three';
import type { RaceTrackConfig } from './raceTrack';

export const CameraMode = {
  ORBITAL: 'orbital',
  FOLLOW: 'follow',
  HORSE: 'horse',
  FINISH_LINE: 'finishLine',
  BANNER: 'banner'
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

  // Banner camera settings
  private bannerPanProgress: number = 0;
  private bannerPanDirection: number = 1; // 1 for left-to-right, -1 for right-to-left
  private bannerSpeedLevel: number = 0; // 0=slow, 1=medium, 2=fast
  private readonly BANNER_PAN_SPEED_SLOW = 0.03;
  private readonly BANNER_PAN_SPEED_MEDIUM = 0.06;
  private readonly BANNER_PAN_SPEED_FAST = 0.12;
  private readonly trackRadius: number;
  private readonly trackLength: number;

  constructor(camera: THREE.PerspectiveCamera, trackConfig: RaceTrackConfig) {
    this.camera = camera;
    this.trackWidth = trackConfig.width;
    this.trackRadius = trackConfig.radius;
    this.trackLength = trackConfig.length;

    // Calculate orbital camera position based on track size
    // Position should be high enough to see the whole track
    const trackDiagonal = Math.sqrt(
      Math.pow(trackConfig.length, 2) +
      Math.pow((trackConfig.radius + trackConfig.width) * 2, 2)
    );
    const orbitalHeight = trackDiagonal * 0.4; // 40% of diagonal for closer view
    const orbitalDistance = trackDiagonal * 0.6; // 60% of diagonal for zoomed in angle
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
      case CameraMode.BANNER:
        this.updateBannerCamera();
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

    // Hide finish banner from this camera view
    this.camera.layers.disable(1);

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
    // Reset banner camera when switching away from it
    if (this.currentMode === CameraMode.BANNER && mode !== CameraMode.BANNER) {
      this.resetBannerCamera();
    }

    // Re-enable layer 1 when switching away from finish line camera
    if (this.currentMode === CameraMode.FINISH_LINE && mode !== CameraMode.FINISH_LINE) {
      this.camera.layers.enable(1);
    }

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

  public cycleBannerSpeed(): void {
    this.bannerSpeedLevel = (this.bannerSpeedLevel + 1) % 3;
    const speedNames = ['Slow', 'Medium', 'Fast'];
    console.log(`Banner Camera Speed: ${speedNames[this.bannerSpeedLevel]}`);
  }

  private resetBannerCamera(): void {
    this.bannerPanProgress = 0;
    this.bannerPanDirection = 1;
    this.bannerSpeedLevel = 0;
  }

  private updateBannerCamera(): void {
    // Pan left to right and back across the banners on the inner edge of bottom straight
    // Banners are positioned at z = radius - 2, x varies from -trackLength/2 to +trackLength/2

    // Get current speed based on speed level
    const speeds = [this.BANNER_PAN_SPEED_SLOW, this.BANNER_PAN_SPEED_MEDIUM, this.BANNER_PAN_SPEED_FAST];
    const currentSpeed = speeds[this.bannerSpeedLevel];

    // Update pan progress
    this.bannerPanProgress += currentSpeed * 0.01 * this.bannerPanDirection;

    // Reverse direction when reaching either end
    if (this.bannerPanProgress >= 1) {
      this.bannerPanProgress = 1;
      this.bannerPanDirection = -1; // Start going back
    } else if (this.bannerPanProgress <= 0) {
      this.bannerPanProgress = 0;
      this.bannerPanDirection = 1; // Start going forward
    }

    // Calculate camera position panning along X axis
    const bannerZ = this.trackRadius - 2; // Inner edge where banners are
    const startX = -this.trackLength / 2;
    const endX = this.trackLength / 2;
    const cameraX = startX + (endX - startX) * this.bannerPanProgress;

    // Position camera to see FRONT of banners (banners face +Z, so camera at +Z)
    const cameraZ = bannerZ + 8; // 8 units away from banners in +Z direction
    const cameraY = 4; // Eye level height

    this.camera.position.set(cameraX, cameraY, cameraZ);

    // Look at the banners (same X, banner Z position, mid height)
    this.camera.lookAt(cameraX, 3, bannerZ);
  }

  public getSelectedHorseIndex(): number {
    return this.selectedHorseIndex;
  }
}
