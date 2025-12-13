import * as THREE from 'three';
import { getThemeConfig, type ThemeType } from '../themeConfig';
import type { RaceTrackConfig } from '../raceTrack';

/**
 * Creates distant hills around the race track to hide the ground plane edge
 * @param group - THREE.Group to add hills to
 * @param config - Race track configuration
 * @param currentTheme - Current theme for hill coloring
 */
export function createDistantHills(
  group: THREE.Group,
  config: RaceTrackConfig,
  currentTheme: ThemeType
): void {
  const themeConfig = getThemeConfig(currentTheme);
  const numSegments = 128; // More segments for smoother continuous ring
  const hillDistance = 90; // Distance from center - brought closer to hide plane edge
  const hillWidth = 25; // Wider segments for better overlap
  const minHeight = 16; // Increased to prevent gaps at low camera angles
  const maxHeight = 24; // Increased to prevent gaps at low camera angles

  // Color based on theme
  const hillColor = themeConfig.fenceType === 'candy-cane' ? 0xffffff : 0x2d5016;
  const material = new THREE.MeshStandardMaterial({
    color: hillColor,
    roughness: 0.9,
    metalness: 0.0
  });

  // Calculate approximate oval circumference
  const trackLength = config.length;
  const trackRadius = config.radius + config.width / 2;
  const hillRadius = trackRadius + hillDistance;
  const straightLength = trackLength;
  const curveLength = Math.PI * hillRadius;
  const totalCircumference = straightLength * 2 + curveLength * 2;

  // Create hills around the oval
  for (let i = 0; i < numSegments; i++) {
    const distance = (i / numSegments) * totalCircumference;
    let x, z;

    // Calculate position based on distance around track
    if (distance < straightLength) {
      // Bottom straight
      const t = distance / straightLength;
      x = -trackLength / 2 + trackLength * t;
      z = hillRadius;
    } else if (distance < straightLength + curveLength) {
      // Right curve
      const curveDistance = distance - straightLength;
      const angle = Math.PI / 2 - (curveDistance / curveLength) * Math.PI;
      x = Math.cos(angle) * hillRadius + trackLength / 2;
      z = Math.sin(angle) * hillRadius;
    } else if (distance < straightLength * 2 + curveLength) {
      // Top straight
      const t = (distance - straightLength - curveLength) / straightLength;
      x = trackLength / 2 - trackLength * t;
      z = -hillRadius;
    } else {
      // Left curve
      const curveDistance = distance - (straightLength * 2 + curveLength);
      const angle = -Math.PI / 2 - (curveDistance / curveLength) * Math.PI;
      x = Math.cos(angle) * hillRadius - trackLength / 2;
      z = Math.sin(angle) * hillRadius;
    }

    // Calculate height using sine wave + randomness for natural variation
    const sineHeight = Math.sin(i * 0.2) * 0.5 + 0.5;
    const randomHeight = Math.random() * 0.3; // Add 30% random variation
    const heightFactor = sineHeight * 0.7 + randomHeight * 0.3;
    const height = minHeight + (maxHeight - minHeight) * heightFactor;

    // Create hill segment - use squashed sphere for rounded tops
    const baseRadius = hillWidth / 2;
    const geometry = new THREE.SphereGeometry(baseRadius, 8, 6);
    const hill = new THREE.Mesh(geometry, material);

    // Position and scale - lower Y position to sit closer to ground
    hill.position.set(x, height / 2 - 3, z);

    // Squash vertically and widen at base for natural hill shape
    hill.scale.set(1.2, height / baseRadius * 0.4, 1.2);

    hill.receiveShadow = true;
    hill.castShadow = true;

    group.add(hill);
  }
}
