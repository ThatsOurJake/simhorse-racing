import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { RaceTrackConfig } from '../raceTrack';

/**
 * Loads and positions bleacher models around the race track
 * @param group - THREE.Group to add bleachers to
 * @param config - Race track configuration
 */
export function loadBleachers(group: THREE.Group, config: RaceTrackConfig): void {
  const loader = new GLTFLoader();
  loader.load(
    '/bleacher.glb',
    (gltf) => {
      // Successfully loaded the model
      const bleacherModel = gltf.scene;

      // Straight sections bleachers
      const numStraightBleachers = 4;
      const spacing = config.length / (numStraightBleachers - 1);

      for (let i = 0; i < numStraightBleachers; i++) {
        const x = -config.length / 2 + spacing * i;

        // Top side bleachers (outer side of top straight)
        const topBleacher = bleacherModel.clone();
        topBleacher.position.set(
          x,
          0,
          -(config.radius + config.width + 6)
        );
        topBleacher.rotation.y = 0; // Face the track
        topBleacher.scale.set(3, 3, 3);
        topBleacher.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        group.add(topBleacher);

        // Bottom side bleachers (outer side of bottom straight)
        const bottomBleacher = bleacherModel.clone();
        bottomBleacher.position.set(
          x,
          0,
          config.radius + config.width + 6
        );
        bottomBleacher.rotation.y = Math.PI; // Face the track (opposite direction)
        bottomBleacher.scale.set(3, 3, 3);
        bottomBleacher.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        group.add(bottomBleacher);
      }

      // Curved sections bleachers
      const numCurveBleachers = 4;
      const bleacherDistance = 6;
      const outerRadius = config.radius + config.width + bleacherDistance;

      // Right curve (from bottom straight to top straight)
      const rightCurveStart = -Math.PI / 2;
      const rightCurveEnd = Math.PI / 2;
      const rightAngleStep = (rightCurveEnd - rightCurveStart) / (numCurveBleachers + 1);

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
      }

      // Left curve (from top straight to bottom straight)
      const leftCurveStart = Math.PI / 2;
      const leftCurveEnd = Math.PI * 1.5;
      const leftAngleStep = (leftCurveEnd - leftCurveStart) / (numCurveBleachers + 1);

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
      }
    },
    (progress) => {
      // Optional: loading progress
      console.log('Loading bleachers:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
    },
    (error) => {
      console.error('Error loading bleacher model:', error);
    }
  );
}
