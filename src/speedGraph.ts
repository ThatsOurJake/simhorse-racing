import type { SpeedPoint } from "./horseStats";

export class SpeedGraph {
  /**
   * Draw a speed curve on a canvas
   */
  public draw(canvas: HTMLCanvasElement, speedCurve: SpeedPoint[]): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Clear canvas
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, width, height);

    if (speedCurve.length === 0) return;

    // Find min and max values
    const maxDistance = speedCurve[speedCurve.length - 1].distance;
    const speeds = speedCurve.map((p) => p.speed);
    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);
    const speedRange = maxSpeed - minSpeed;

    // Draw axes
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw speed labels
    ctx.fillStyle = "#888";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight * i) / 5;
      const speed = maxSpeed - (speedRange * i) / 5;
      ctx.fillText(speed.toFixed(1), padding - 5, y + 3);
    }

    // Draw distance axis label and max distance value
    ctx.textAlign = "center";
    ctx.fillText("Distance", width / 2, height - 25);
    ctx.textAlign = "right";
    ctx.fillText(
      maxDistance.toFixed(0),
      width - padding,
      height - padding + 15,
    );

    // Draw speed curve
    ctx.strokeStyle = "#4ecdc4";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < speedCurve.length; i++) {
      const point = speedCurve[i];
      const x = padding + (point.distance / maxDistance) * graphWidth;
      const y =
        height -
        padding -
        ((point.speed - minSpeed) / speedRange) * graphHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw fill under curve
    ctx.fillStyle = "rgba(78, 205, 196, 0.2)";
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Find key points on the curve
    const keyPoints: { x: number; y: number; color: string; label: string }[] =
      [];

    // Find acceleration end (when speed stabilizes to cruising)
    let accelEndIndex = 0;

    // Look for where speed curve flattens (derivative near zero)
    for (let i = 5; i < speedCurve.length - 5; i++) {
      const speedChange = Math.abs(
        speedCurve[i + 1].speed - speedCurve[i].speed,
      );
      if (speedChange < 0.05) {
        accelEndIndex = i;
        break;
      }
    }

    if (accelEndIndex > 0) {
      const point = speedCurve[accelEndIndex];
      const x = padding + (point.distance / maxDistance) * graphWidth;
      const y =
        height -
        padding -
        ((point.speed - minSpeed) / speedRange) * graphHeight;
      keyPoints.push({ x, y, color: "#ffe66d", label: "Cruising Speed" });
    }

    // Find final stretch start (85% of track where speed starts increasing again)
    const finalStretchIndex = Math.floor(speedCurve.length * 0.85);

    if (finalStretchIndex < speedCurve.length) {
      const point = speedCurve[finalStretchIndex];
      const x = padding + (point.distance / maxDistance) * graphWidth;
      const y =
        height -
        padding -
        ((point.speed - minSpeed) / speedRange) * graphHeight;
      keyPoints.push({ x, y, color: "#4ecdc4", label: "Final Stretch" });
    }

    // Draw key points as colored circles
    keyPoints.forEach((point) => {
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw legend below the graph
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    const legendStartX = padding;
    const legendY = height - 10;
    const legendSpacing = 100; // Horizontal spacing between legend items

    keyPoints.forEach((point, index) => {
      const legendX = legendStartX + index * legendSpacing;

      // Draw colored circle
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = "#ddd";
      ctx.fillText(point.label, legendX + 10, legendY + 4);
    });
  }
}
