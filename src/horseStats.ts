export interface HorseStats {
  speed: number; // 0-1, determines max speed
  stamina: number; // 0-1, how long at max speed before depleting
  acceleration: number; // 0-1, how fast to reach max speed
}

export type HatType =
  | "horse-ears"
  | "reindeer-antlers"
  | "top-hat"
  | "crown"
  | "propeller-hat";
export type FaceType =
  | "happy"
  | "innocent"
  | "red-nose"
  | "angry"
  | "shocked"
  | "glasses";

export interface HorseData {
  id: string;
  name: string;
  stats: HorseStats;
  baseSpeed: number; // Random speed assigned from seed (6-10 units/sec)
  color: number; // Cube color for now
  hat: HatType;
  face: FaceType;
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
 * Generate random horse stats (rounded to 3 decimal places)
 */
export function generateRandomStats(): HorseStats {
  return {
    speed: Math.round(Math.random() * 1000) / 1000,
    stamina: Math.round(Math.random() * 1000) / 1000,
    acceleration: Math.round(Math.random() * 1000) / 1000,
  };
}

/**
 * Calculate speed curve for a horse based on stats and base speed
 * Returns array of speed points across the track distance (base curve without variance)
 */
export function calculateSpeedCurve(
  horse: HorseData,
  trackLength: number,
): SpeedPoint[] {
  const points: SpeedPoint[] = [];
  const {
    speed: speedStat,
    stamina: staminaStat,
    acceleration: accelerationStat,
  } = horse.stats;

  // Calculate actual speeds - wider range for more drama
  const maxSpeed = horse.baseSpeed * (0.6 + speedStat * 0.7); // 60-130% of base speed
  const cruisingSpeed = maxSpeed * 0.85; // Cruising at 85% of max

  // Calculate distances for each phase
  const accelerationDistance = trackLength * (0.15 - accelerationStat * 0.1); // 5-15% of track
  const midRaceEnd = trackLength * 0.85; // Mid-race ends at 85%
  const finalStretch = trackLength * 0.15; // Last 15% is final stretch

  // Sample points along the track
  const numSamples = 100;
  for (let i = 0; i <= numSamples; i++) {
    const distance = (trackLength * i) / numSamples;
    let currentSpeed: number;

    if (distance < accelerationDistance) {
      // Acceleration phase - get up to speed
      const t = distance / accelerationDistance;
      const easeT = t * t * (3 - 2 * t); // Smooth interpolation
      currentSpeed = maxSpeed * 0.4 + (cruisingSpeed - maxSpeed * 0.4) * easeT;
    } else if (distance < midRaceEnd) {
      // Mid-race cruising - base speed (variance will be applied during race)
      currentSpeed = cruisingSpeed;
    } else {
      // Final stretch - horses push for the finish
      const t = (distance - midRaceEnd) / finalStretch;
      const pushSpeed =
        cruisingSpeed + (maxSpeed - cruisingSpeed) * (0.5 + staminaStat * 0.5);
      currentSpeed = cruisingSpeed + (pushSpeed - cruisingSpeed) * t;
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
