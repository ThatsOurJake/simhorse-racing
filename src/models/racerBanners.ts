import * as THREE from "three";
import { FONT } from "../constants";
import { createFace, createHat } from "../horseAccessories";
import type { HorseData } from "../horseStats";
import { getComplementaryColor } from "../utils/colorUtils";

export class RacingBanner extends THREE.Mesh {
  private _isRacerBanner: boolean = false;

  public get isRacerBanner(): boolean {
    return this._isRacerBanner;
  }

  public set isRacerBanner(v: boolean) {
    this._isRacerBanner = v;
  }
}

/**
 * Generates a 2D preview image of a horse with accessories
 * @param horse - The horse data containing color, hat, and face
 * @returns Data URL of the rendered horse image
 */
export function generateHorsePreview(horse: HorseData): string {
  // Create temporary scene for rendering
  const scene = new THREE.Scene();
  scene.background = null;

  // Create camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.set(3, 2, 3);
  camera.lookAt(0, 0.5, 0);

  // Add lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Create horse cube
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial({ color: horse.color });
  const horseMesh = new THREE.Mesh(geometry, material);
  horseMesh.rotation.y = 0; // Face forward
  scene.add(horseMesh);

  // Add hat
  const hat = createHat(horse.hat, horse.color);
  horseMesh.add(hat);

  // Add face
  const faceAccessories = createFace(horse.face, horseMesh);
  faceAccessories.forEach((accessory) => {
    horseMesh.add(accessory);
  });

  // Render to canvas
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(256, 256);
  renderer.render(scene, camera);

  const dataUrl = renderer.domElement.toDataURL();
  renderer.dispose();

  return dataUrl;
}

/**
 * Creates a banner fabric mesh with racer information
 * @param x - X position
 * @param y - Y position
 * @param z - Z position
 * @param width - Banner width
 * @param height - Banner height
 * @param horse - Horse data for banner content
 * @param group - THREE.Group to add the banner to
 */
export function createBannerFabric(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  horse: HorseData,
  group: THREE.Group,
): void {
  // Create canvas texture with horse render
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const context = canvas.getContext("2d")!;

  // Background (complementary color to racer)
  const complementaryColor = getComplementaryColor(horse.color);
  context.fillStyle = `#${complementaryColor.toString(16).padStart(6, "0")}`;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Black trim border
  context.strokeStyle = "#000000";
  context.lineWidth = 8;
  context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  // Draw name text in lower half (split into 2 lines if needed)
  context.fillStyle = "#000000";
  context.font = `bold 32px ${FONT}`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  const name = horse.name;
  const lowerHalfY = canvas.height * 0.75; // Center of lower half

  // Split name into 2 lines if it contains a space (preferably at the first space)
  const firstSpace = name.indexOf(" ");
  if (firstSpace > 0 && firstSpace < name.length - 1) {
    // Split at the first space
    const line1 = name.substring(0, firstSpace).trim();
    const line2 = name.substring(firstSpace + 1).trim();
    context.fillText(line1, canvas.width / 2, lowerHalfY - 20);
    context.fillText(line2, canvas.width / 2, lowerHalfY + 20);
  } else if (name.length > 8) {
    // Fallback: split at midpoint if no space
    const midPoint = Math.floor(name.length / 2);
    const line1 = name.substring(0, midPoint).trim();
    const line2 = name.substring(midPoint).trim();
    context.fillText(line1, canvas.width / 2, lowerHalfY - 20);
    context.fillText(line2, canvas.width / 2, lowerHalfY + 20);
  } else {
    // Single line for short names
    context.fillText(name, canvas.width / 2, lowerHalfY);
  }

  // Use PlaneGeometry for simpler UV mapping
  const geometry = new THREE.PlaneGeometry(width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });

  const banner = new RacingBanner(geometry, material);
  banner.position.set(x, y - height / 2, z + 0.3);
  banner.rotation.y = 0;
  banner.isRacerBanner = true;
  group.add(banner);

  // Generate horse render asynchronously
  const horseImage = generateHorsePreview(horse);
  const img = new Image();
  img.onload = () => {
    // Draw horse in upper half, centered and larger
    const horseSize = 300;
    const upperHalfY = canvas.height * 0.25; // Center of upper half
    context.drawImage(
      img,
      canvas.width / 2 - horseSize / 2,
      upperHalfY - horseSize / 2,
      horseSize,
      horseSize,
    );

    // Update texture after drawing
    texture.needsUpdate = true;
  };
  img.onerror = (e) => {
    console.error("Failed to load horse preview image:", e);
  };
  img.src = horseImage;
}
