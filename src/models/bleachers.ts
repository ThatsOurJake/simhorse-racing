import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CrowdWaveController } from "../animations/crowdWave";
import {
  type AnimatedSpectator,
  SpectatorAnimationController,
} from "../animations/spectatorAnimations";
import type { RaceTrackConfig } from "../raceTrack";
import { createSpectator } from "./spectator";

// Global animation controller for all bleacher spectators
const animationController = new SpectatorAnimationController();
const waveController = new CrowdWaveController();

// Animation probability (60% of spectators will be animated)
const ANIMATION_PROBABILITY = 0.6;

/**
 * Adds spectators to a bleacher
 * @param bleacher - The bleacher object to add spectators to
 * @param bleacherIndex - Index for wave ordering
 */
function addSpectatorsToBlacher(
  bleacher: THREE.Object3D,
  bleacherIndex: number,
): void {
  // Find the Seat_0 object specifically
  let seatObject: THREE.Object3D | undefined;
  bleacher.traverse((child) => {
    if (child.name === "Seat_0") {
      seatObject = child as THREE.Object3D;
    }
  });

  if (!seatObject) {
    return;
  }

  // Platform positions from the actual bleacher geometry (Y, Z center)
  // These are relative to the Seat_0 object's local coordinates
  // Platforms step back as they go up
  const platforms = [
    { y: -0.6, z: 0.63 }, // Bottom platform
    { y: -0.2, z: 0.25 }, // Second platform
    { y: 0.2, z: -0.13 }, // Third platform
    { y: 0.6, z: -0.51 }, // Top platform
  ];

  const spectatorWidth = 0.3; // Width of spectator body
  const spectatorHeight = 0.6; // Total height of spectator (2 cubes x 0.3)
  const platformEdgeBuffer = spectatorWidth / 2; // Keep spectators fully on platform
  const xMin = -2.05 + platformEdgeBuffer;
  const xMax = 2.05 - platformEdgeBuffer;
  const minSpacing = 0.5; // Minimum distance between spectator centers
  const xRange = xMax - xMin;

  for (let level = 0; level < 4; level++) {
    const platform = platforms[level];

    // Random count of spectators for this level (3-8)
    const spectatorCount = Math.floor(Math.random() * 6) + 3; // 3 to 8
    const usedPositions: number[] = [];

    for (let i = 0; i < spectatorCount; i++) {
      // Find a valid X position that doesn't overlap with existing spectators
      let xPos: number;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        xPos = xMin + Math.random() * (xMax - xMin);
        attempts++;
      } while (
        attempts < maxAttempts &&
        usedPositions.some((pos) => Math.abs(pos - xPos) < minSpacing)
      );

      // If we found a valid position, create the spectator
      if (attempts < maxAttempts) {
        usedPositions.push(xPos);

        const spectatorData = createSpectator();
        const spectator = spectatorData.group;
        const yPos = platform.y + spectatorHeight / 2;
        spectator.position.set(xPos, yPos, platform.z);
        spectator.castShadow = true;
        seatObject.add(spectator);

        // Add to wave controller with normalized position for right-to-left ripple
        const normalizedX = 1 - (xPos - xMin) / xRange; // 1.0 (right) to 0.0 (left)
        waveController.addSpectator({
          group: spectator,
          topCube: spectatorData.topCube,
          originalY: yPos,
          bleacherIndex: bleacherIndex,
          positionInBleacher: normalizedX,
        });

        // Randomly decide if this spectator should be animated
        const isAnimated = Math.random() < ANIMATION_PROBABILITY;

        if (isAnimated) {
          const animatedSpectator: AnimatedSpectator = {
            group: spectator,
            topCube: spectatorData.topCube,
            isAnimated: true,
            phaseOffset: Math.random() * Math.PI * 2, // Random start phase
            swaySpeed: 0.5 + Math.random() * 0.5, // 0.5-1.0 Hz
            bobSpeed: 0.8 + Math.random() * 0.4, // 0.8-1.2 Hz
            jumpSpeed: 2.0 + Math.random() * 1.0, // 2.0-3.0 Hz
          };
          animationController.addSpectator(animatedSpectator);
        }
      }
    }
  }
}

export function loadBleachers(
  scene: THREE.Scene | THREE.Group<THREE.Object3DEventMap>,
  config: RaceTrackConfig,
): THREE.Group {
  const group = new THREE.Group();
  const loader = new GLTFLoader();

  loader.load(
    "/bleacher.glb",
    (gltf) => {
      // Successfully loaded the model
      const bleacherModel = gltf.scene;

      // Track bleacher indices for wave ordering
      let bleacherIndex = 0;
      const topBleacherIndices: number[] = [];
      const rightCurveBleacherIndices: number[] = [];
      const bottomBleacherIndices: number[] = [];
      const leftCurveBleacherIndices: number[] = [];

      // Straight sections bleachers
      const numStraightBleachers = 4;
      const spacing = config.length / (numStraightBleachers - 1);

      for (let i = 0; i < numStraightBleachers; i++) {
        const x = -config.length / 2 + spacing * i;

        // Top side bleachers (outer side of top straight)
        // Skip indices 1 and 2 to make room for the big screen
        if (i !== 1 && i !== 2) {
          const topBleacher = bleacherModel.clone();
          topBleacher.position.set(x, 0, -(config.radius + config.width + 6));
          topBleacher.rotation.y = 0; // Face the track
          topBleacher.scale.set(3, 3, 3);
          topBleacher.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          group.add(topBleacher);

          topBleacherIndices.push(bleacherIndex);
          addSpectatorsToBlacher(topBleacher, bleacherIndex);
          bleacherIndex++;
        }

        // Bottom side bleachers (outer side of bottom straight)
        const bottomBleacher = bleacherModel.clone();
        bottomBleacher.position.set(x, 0, config.radius + config.width + 6);
        bottomBleacher.rotation.y = Math.PI; // Face the track (opposite direction)
        bottomBleacher.scale.set(3, 3, 3);
        bottomBleacher.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        group.add(bottomBleacher);

        bottomBleacherIndices.push(bleacherIndex);
        addSpectatorsToBlacher(bottomBleacher, bleacherIndex);
        bleacherIndex++;
      }

      // Curved sections bleachers
      const numCurveBleachers = 4;
      const bleacherDistance = 6;
      const outerRadius = config.radius + config.width + bleacherDistance;

      // Right curve (from bottom straight to top straight)
      const rightCurveStart = -Math.PI / 2;
      const rightCurveEnd = Math.PI / 2;
      const rightAngleStep =
        (rightCurveEnd - rightCurveStart) / (numCurveBleachers + 1);

      for (let i = 0; i < numCurveBleachers; i++) {
        const angle = rightCurveStart + rightAngleStep * (i + 1);
        const x = Math.cos(angle) * outerRadius + config.length / 2;
        const z = Math.sin(angle) * outerRadius;

        const bleacher = bleacherModel.clone();
        bleacher.position.set(x, 0, z);
        bleacher.rotation.y = -(angle + Math.PI / 2); // Face inward toward the track
        bleacher.scale.set(3, 3, 3);
        bleacher.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        group.add(bleacher);

        rightCurveBleacherIndices.push(bleacherIndex);
        addSpectatorsToBlacher(bleacher, bleacherIndex);
        bleacherIndex++;
      }

      // Left curve (from top straight to bottom straight)
      const leftCurveStart = Math.PI / 2;
      const leftCurveEnd = Math.PI * 1.5;
      const leftAngleStep =
        (leftCurveEnd - leftCurveStart) / (numCurveBleachers + 1);

      for (let i = 0; i < numCurveBleachers; i++) {
        const angle = leftCurveStart + leftAngleStep * (i + 1);
        const x = Math.cos(angle) * outerRadius - config.length / 2;
        const z = Math.sin(angle) * outerRadius;

        const bleacher = bleacherModel.clone();
        bleacher.position.set(x, 0, z);
        bleacher.rotation.y = -(angle + Math.PI / 2); // Face inward toward the track
        bleacher.scale.set(3, 3, 3);
        bleacher.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        group.add(bleacher);

        leftCurveBleacherIndices.push(bleacherIndex);
        addSpectatorsToBlacher(bleacher, bleacherIndex);
        bleacherIndex++;
      }

      // Set up wave order: Clockwise around track starting from top-left
      // top-left (0) -> left curve (13-10) -> bottom (1,2,3,5) -> right curve (9-6) -> top-right (4)
      const waveOrder = [
        0, // top-left
        13, // left curve (reversed)
        12, // left curve
        11, // left curve
        10, // left curve
        1, // bottom-left
        2, // bottom
        3, // bottom
        5, // bottom-right
        9, // right curve (reversed)
        8, // right curve
        7, // right curve
        6, // right curve
        4, // top-right
      ];

      waveController.setBleacherWaveOrder(waveOrder);

      // Add the group to the scene after all bleachers are set up
      scene.add(group);
    },
    undefined,
    (error) => {
      console.error("Error loading bleacher model:", error);
    },
  );

  return group;
}

/**
 * Update spectator animations
 * @param deltaTime - Time elapsed since last frame in seconds
 */
export function updateSpectatorAnimations(deltaTime: number): void {
  // Update wave controller
  waveController.update(deltaTime);

  // Only update normal animations if wave is not active
  if (!waveController.isWaveRunning()) {
    animationController.update(deltaTime);
  }
}

/**
 * Set whether the race is active (affects animation style)
 * @param isActive - True if race is in progress
 */
export function setRaceActive(isActive: boolean): void {
  animationController.setRaceActive(isActive);
}

/**
 * Trigger the crowd wave animation
 */
export function startCrowdWave(): void {
  waveController.startWave();
}

/**
 * Check if crowd wave is currently running
 */
export function isCrowdWaveActive(): boolean {
  return waveController.isWaveRunning();
}
