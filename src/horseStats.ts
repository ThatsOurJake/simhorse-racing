export interface HorseStats {
  speed: number; // 0-1, determines max speed
  stamina: number; // 0-1, how long at max speed before depleting
  acceleration: number; // 0-1, how fast to reach max speed
}

export interface HorseData {
  id: string;
  name: string;
  stats: HorseStats;
  baseSpeed: number; // Random speed assigned from seed (6-10 units/sec)
  color: number; // Cube color for now
}

export interface SpeedPoint {
  distance: number; // Progress along track
  speed: number; // Speed at this point
}

/**
 * Generate a default horse name
 * This function will be updated later for more creative names
 */
export function generateHorseName(index: number): string {
  return `Horse ${index + 1}`;
}

/**
 * Calculate speed curve for a horse based on stats and base speed
 * Returns array of speed points across the track distance
 */
export function calculateSpeedCurve(
  horse: HorseData,
  trackLength: number
): SpeedPoint[] {
  const points: SpeedPoint[] = [];
  const { speed: speedStat, stamina: staminaStat, acceleration: accelerationStat } = horse.stats;

  // Calculate actual speeds
  const maxSpeed = horse.baseSpeed * (0.5 + speedStat * 0.5); // 50-100% of base speed
  const minSpeed = maxSpeed * 0.3; // 30% of max speed

  // Calculate distances for each phase
  const accelerationDistance = trackLength * (0.2 - accelerationStat * 0.15); // 5-20% of track
  const maxSpeedDistance = trackLength * staminaStat * 0.5; // Up to 50% at max speed
  const decelerationStartDistance = accelerationDistance + maxSpeedDistance;

  // Sample points along the track
  const numSamples = 100;
  for (let i = 0; i <= numSamples; i++) {
    const distance = (trackLength * i) / numSamples;
    let currentSpeed: number;

    if (distance < accelerationDistance) {
      // Acceleration phase - ease into max speed
      const t = distance / accelerationDistance;
      const easeT = t * t * (3 - 2 * t); // Smooth interpolation
      currentSpeed = minSpeed + (maxSpeed - minSpeed) * easeT;
    } else if (distance < decelerationStartDistance) {
      // Max speed phase
      currentSpeed = maxSpeed;
    } else {
      // Deceleration phase - linear drop to min speed
      const remainingDistance = trackLength - decelerationStartDistance;
      const t = Math.min((distance - decelerationStartDistance) / remainingDistance, 1);
      currentSpeed = maxSpeed - (maxSpeed - minSpeed) * t;
    }

    points.push({ distance, speed: currentSpeed });
  }

  return points;
}

/**
 * Generate a random base speed for a horse using a seeded random number generator
 */
export function generateBaseSpeed(seed: number, horseIndex: number): number {
  // Simple seeded random using sine
  const x = Math.sin(seed + horseIndex * 12345.6789) * 10000;
  const random = x - Math.floor(x);

  // Map to 6-10 range
  return 6 + random * 4;
}

/**
 * Calculate estimated race time for a horse
 */
export function calculateRaceTime(speedCurve: SpeedPoint[]): number {
  let totalTime = 0;

  for (let i = 1; i < speedCurve.length; i++) {
    const prevPoint = speedCurve[i - 1];
    const currentPoint = speedCurve[i];
    const distance = currentPoint.distance - prevPoint.distance;
    const avgSpeed = (prevPoint.speed + currentPoint.speed) / 2;

    if (avgSpeed > 0) {
      totalTime += distance / avgSpeed;
    }
  }

  return totalTime;
}
