import * as THREE from 'three';
import type { RaceTrackConfig } from '../raceTrack';

export interface BigScreenSystem {
  group: THREE.Group;
  renderTarget: THREE.WebGLRenderTarget;
  followCamera: THREE.PerspectiveCamera;
  screenMaterial: THREE.MeshStandardMaterial;
  updateFollowCamera: (
    horsePositions: THREE.Vector3[],
    getTrackPosition?: (progress: number, laneOffset?: number) => THREE.Vector3,
    leadHorseProgress?: number
  ) => void;
}

/**
 * Creates a big screen display system that shows the follow camera feed
 * @param config - Race track configuration
 * @param placeholderTexture - Texture to display when no racers are present
 * @returns BigScreenSystem containing the screen group and camera system
 */
export function createBigScreen(
  config: RaceTrackConfig,
  placeholderTexture: THREE.Texture
): BigScreenSystem {
  const group = new THREE.Group();

  // Calculate dimensions
  const screenWidth = ((config.length * 2) / 3) * 0.75; // 2/3 of straight length, scaled down 25%
  const screenAspectRatio = 16 / 9;
  const screenHeight = screenWidth / screenAspectRatio;

  // Total structure height (screen is top 2/3, speaker is bottom 1/3)
  const speakerHeight = screenHeight / 2; // This makes speaker = 1/3 of total
  const totalHeight = screenHeight + speakerHeight;

  const frameThickness = 0.3;
  const bezelWidth = 0.5;
  const depth = 1.5;

  // Position centered where bleachers 1 and 2 were on the top straight
  const positionX = 0; // Center of track
  const positionZ = -(config.radius + config.width + 6); // Top straight (negative Z)
  const positionY = totalHeight / 2; // Lift so bottom is at ground level

  // Create render target for the follow camera feed
  const renderTarget = new THREE.WebGLRenderTarget(1280, 720, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  });

  // Configure render target texture to flip horizontally
  renderTarget.texture.wrapS = THREE.RepeatWrapping;
  renderTarget.texture.repeat.x = -1;

  // Create follow camera for the screen feed
  const followCamera = new THREE.PerspectiveCamera(75, screenAspectRatio, 0.1, 1000);

  // Camera offset configurations (same as main follow camera)
  const FOLLOW_CAM_HEIGHT = 5;
  const FOLLOW_CAM_BEHIND_DISTANCE = 10;

  // Update function for the follow camera
  const updateFollowCamera = (
    horsePositions: THREE.Vector3[],
    getTrackPosition?: (progress: number, laneOffset?: number) => THREE.Vector3,
    leadHorseProgress?: number
  ) => {
    if (horsePositions.length === 0) return;

    if (getTrackPosition && leadHorseProgress !== undefined) {
      const cameraProgress = leadHorseProgress + FOLLOW_CAM_BEHIND_DISTANCE;
      const cameraTrackPos = getTrackPosition(cameraProgress);

      const cameraPosition = new THREE.Vector3(
        cameraTrackPos.x,
        FOLLOW_CAM_HEIGHT,
        cameraTrackPos.z
      );

      followCamera.position.lerp(cameraPosition, 0.08);

      const leadPos = getTrackPosition(leadHorseProgress);
      const leadHorsePos = new THREE.Vector3(leadPos.x, 1, leadPos.z);
      followCamera.lookAt(leadHorsePos);
    } else {
      const leadHorse = horsePositions[0];
      const cameraPosition = new THREE.Vector3()
        .copy(leadHorse)
        .add(new THREE.Vector3(FOLLOW_CAM_BEHIND_DISTANCE, FOLLOW_CAM_HEIGHT, 0));

      followCamera.position.lerp(cameraPosition, 0.08);
      followCamera.lookAt(leadHorse);
    }
  };

  // --- BACK PANEL ---
  const backPanelGeometry = new THREE.BoxGeometry(
    screenWidth + frameThickness * 2,
    totalHeight + frameThickness * 2,
    depth
  );
  const backPanelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
    metalness: 0.3,
  });
  const backPanel = new THREE.Mesh(backPanelGeometry, backPanelMaterial);
  backPanel.position.set(positionX, positionY, positionZ);
  backPanel.rotation.y = Math.PI; // Face north (toward camera/orbital view)
  backPanel.castShadow = true;
  backPanel.receiveShadow = true;
  group.add(backPanel);

  // --- SCREEN (top 2/3) ---
  const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
  const screenMaterial = new THREE.MeshStandardMaterial({
    map: placeholderTexture, // Start with placeholder
    emissiveMap: placeholderTexture, // Use same texture for emission to make it glow
    emissive: 0xffffff, // White emissive color
    emissiveIntensity: 0.5, // Make it glow
    roughness: 0.2,
    metalness: 0.1,
    side: THREE.DoubleSide, // Render both sides
  });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(
    positionX,
    positionY + speakerHeight / 2, // Move up by half speaker height
    positionZ + depth / 2 + 0.01 // Slightly in front of back panel (toward camera)
  );
  screen.rotation.y = Math.PI; // Face north (toward camera)
  group.add(screen);

  // --- SCREEN BEZEL/FRAME ---
  const bezelMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.6,
    metalness: 0.4,
  });

  // Top bezel
  const topBezel = new THREE.Mesh(
    new THREE.BoxGeometry(screenWidth + bezelWidth * 2, bezelWidth, depth * 0.8),
    bezelMaterial
  );
  topBezel.position.set(
    positionX,
    positionY + speakerHeight / 2 + screenHeight / 2 + bezelWidth / 2,
    positionZ + depth / 2 + 0.02
  );
  topBezel.rotation.y = Math.PI;
  topBezel.castShadow = true;
  group.add(topBezel);

  // Bottom bezel (between screen and speaker)
  const bottomBezel = new THREE.Mesh(
    new THREE.BoxGeometry(screenWidth + bezelWidth * 2, bezelWidth, depth * 0.8),
    bezelMaterial
  );
  bottomBezel.position.set(
    positionX,
    positionY + speakerHeight / 2 - screenHeight / 2 - bezelWidth / 2,
    positionZ + depth / 2 + 0.02
  );
  bottomBezel.rotation.y = Math.PI;
  bottomBezel.castShadow = true;
  group.add(bottomBezel);

  // Left bezel
  const leftBezel = new THREE.Mesh(
    new THREE.BoxGeometry(bezelWidth, screenHeight, depth * 0.8),
    bezelMaterial
  );
  leftBezel.position.set(
    positionX - screenWidth / 2 - bezelWidth / 2,
    positionY + speakerHeight / 2,
    positionZ + depth / 2 + 0.02
  );
  leftBezel.rotation.y = Math.PI;
  leftBezel.castShadow = true;
  group.add(leftBezel);

  // Right bezel
  const rightBezel = new THREE.Mesh(
    new THREE.BoxGeometry(bezelWidth, screenHeight, depth * 0.8),
    bezelMaterial
  );
  rightBezel.position.set(
    positionX + screenWidth / 2 + bezelWidth / 2,
    positionY + speakerHeight / 2,
    positionZ + depth / 2 + 0.02
  );
  rightBezel.rotation.y = Math.PI;
  rightBezel.castShadow = true;
  group.add(rightBezel);

  // --- SPEAKER SECTION (bottom 1/3) with hexagonal mesh pattern ---
  const speakerGeometry = new THREE.PlaneGeometry(screenWidth, speakerHeight);
  const speakerMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.2,
  });
  const speakerPanel = new THREE.Mesh(speakerGeometry, speakerMaterial);
  speakerPanel.position.set(
    positionX,
    positionY - screenHeight / 2, // Position below screen
    positionZ + depth / 2 + 0.01
  );
  speakerPanel.rotation.y = Math.PI;
  group.add(speakerPanel);

  // Create hexagonal mesh pattern for speaker
  const hexagonGroup = new THREE.Group();
  const hexRadius = 0.3;
  const hexSpacing = hexRadius * 2.2;
  const hexMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.7,
    metalness: 0.3,
  });

  // Calculate how many hexagons fit
  const numHexX = Math.floor(screenWidth / hexSpacing);
  const numHexY = Math.floor(speakerHeight / hexSpacing);

  for (let y = 0; y < numHexY; y++) {
    for (let x = 0; x < numHexX; x++) {
      const hexGeometry = new THREE.CylinderGeometry(hexRadius, hexRadius, 0.1, 6);
      const hex = new THREE.Mesh(hexGeometry, hexMaterial);

      // Offset every other row for hexagon packing
      const xOffset = (y % 2) * (hexSpacing / 2);
      const xPos = -screenWidth / 2 + x * hexSpacing + hexSpacing / 2 + xOffset;
      const yPos = -speakerHeight / 2 + y * hexSpacing + hexSpacing / 2;

      hex.position.set(xPos, yPos, 0.06);
      hex.rotation.x = Math.PI / 2;
      hex.rotation.z = Math.PI / 2;
      hexagonGroup.add(hex);
    }
  }

  hexagonGroup.position.set(
    positionX,
    positionY - screenHeight / 2,
    positionZ + depth / 2 + 0.01
  );
  hexagonGroup.rotation.y = Math.PI;
  group.add(hexagonGroup);

  return {
    group,
    renderTarget,
    followCamera,
    screenMaterial,
    updateFollowCamera,
  };
}
