import type { SpeedPoint } from './horseStats';

export class SpeedGraph {
  /**
   * Draw a speed curve on a canvas
   */
  public draw(canvas: HTMLCanvasElement, speedCurve: SpeedPoint[]): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Clear canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);

    if (speedCurve.length === 0) return;

    // Find min and max values
    const maxDistance = speedCurve[speedCurve.length - 1].distance;
    const speeds = speedCurve.map((p) => p.speed);
    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);
    const speedRange = maxSpeed - minSpeed;

    // Draw axes
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw speed labels
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight * i) / 5;
      const speed = maxSpeed - (speedRange * i) / 5;
      ctx.fillText(speed.toFixed(1), padding - 5, y + 3);
    }

    // Draw distance label
    ctx.textAlign = 'center';
    ctx.fillText('Distance', width / 2, height - 10);
    ctx.textAlign = 'right';
    ctx.fillText(maxDistance.toFixed(0), width - padding, height - padding + 15);

    // Draw speed curve
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < speedCurve.length; i++) {
      const point = speedCurve[i];
      const x = padding + (point.distance / maxDistance) * graphWidth;
      const y = height - padding - ((point.speed - minSpeed) / speedRange) * graphHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw fill under curve
    ctx.fillStyle = 'rgba(78, 205, 196, 0.2)';
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw labels for phases
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';

    // Find acceleration end point
    let accelEndIndex = 0;
    for (let i = 1; i < speedCurve.length; i++) {
      if (Math.abs(speedCurve[i].speed - maxSpeed) < 0.01) {
        accelEndIndex = i;
        break;
      }
    }

    if (accelEndIndex > 0) {
      const accelX = padding + (speedCurve[accelEndIndex].distance / maxDistance) * graphWidth / 2;
      ctx.fillText('Accel', accelX, height - padding + 15);
    }

    // Find deceleration start point
    let decelStartIndex = speedCurve.length - 1;
    for (let i = speedCurve.length - 1; i >= 0; i--) {
      if (Math.abs(speedCurve[i].speed - maxSpeed) < 0.01) {
        decelStartIndex = i;
        break;
      }
    }

    if (decelStartIndex < speedCurve.length - 1 && accelEndIndex < decelStartIndex) {
      const maxSpeedX = padding + ((speedCurve[accelEndIndex].distance + speedCurve[decelStartIndex].distance) / 2 / maxDistance) * graphWidth;
      ctx.fillText('Max Speed', maxSpeedX, height - padding + 15);

      const decelX = padding + ((speedCurve[decelStartIndex].distance + maxDistance) / 2 / maxDistance) * graphWidth;
      ctx.fillText('Decel', decelX, height - padding + 15);
    }
  }
}
