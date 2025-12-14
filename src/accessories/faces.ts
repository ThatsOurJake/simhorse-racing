import * as THREE from "three";

/**
 * Apply happy face texture to the front of the cube
 */
export function applyHappyFaceTexture(horseMesh: THREE.Mesh): void {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Get the horse's color from the material
  const horseMaterial = Array.isArray(horseMesh.material)
    ? horseMesh.material[0]
    : horseMesh.material;
  const horseColor = (horseMaterial as THREE.MeshLambertMaterial).color;

  // Fill background with horse color (slightly darker to match shading)
  const darkerColor = horseColor.clone().multiplyScalar(0.85);
  ctx.fillStyle = `#${darkerColor.getHexString()}`;
  ctx.fillRect(0, 0, 256, 256);

  // Draw simple eyes
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(80, 90, 15, 0, Math.PI * 2);
  ctx.arc(176, 90, 15, 0, Math.PI * 2);
  ctx.fill();

  // Draw smile
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(128, 128, 50, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Create texture and apply to front face
  const texture = new THREE.CanvasTexture(canvas);
  const faceMaterial = new THREE.MeshLambertMaterial({
    map: texture,
  });

  // Apply material to specific face (front face is index 4 in BoxGeometry)
  if (Array.isArray(horseMesh.material)) {
    horseMesh.material[4] = faceMaterial;
  } else {
    // Convert to array of materials
    const originalMaterial = horseMesh.material;
    horseMesh.material = [
      originalMaterial.clone(),
      originalMaterial.clone(),
      originalMaterial.clone(),
      originalMaterial.clone(),
      faceMaterial, // Front face
      originalMaterial.clone(),
    ];
  }
}

/**
 * Apply innocent eyes texture to the front of the cube
 */
export function applyInnocentEyesTexture(horseMesh: THREE.Mesh): void {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Get the horse's color from the material
  const horseMaterial = Array.isArray(horseMesh.material)
    ? horseMesh.material[0]
    : horseMesh.material;
  const horseColor = (horseMaterial as THREE.MeshLambertMaterial).color;

  // Fill background with horse color (slightly darker to match shading)
  const darkerColor = horseColor.clone().multiplyScalar(0.85);
  ctx.fillStyle = `#${darkerColor.getHexString()}`;
  ctx.fillRect(0, 0, 256, 256);

  // Draw large innocent eyes
  // Left eye - white
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(80, 100, 35, 0, Math.PI * 2);
  ctx.fill();

  // Right eye - white
  ctx.beginPath();
  ctx.arc(176, 100, 35, 0, Math.PI * 2);
  ctx.fill();

  // Left pupil - black
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(80, 100, 18, 0, Math.PI * 2);
  ctx.fill();

  // Right pupil - black
  ctx.beginPath();
  ctx.arc(176, 100, 18, 0, Math.PI * 2);
  ctx.fill();

  // Shine in eyes (white dots)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(85, 95, 8, 0, Math.PI * 2);
  ctx.arc(181, 95, 8, 0, Math.PI * 2);
  ctx.fill();

  // Create texture and apply to front face
  const texture = new THREE.CanvasTexture(canvas);
  const faceMaterial = new THREE.MeshLambertMaterial({
    map: texture,
  });

  // Apply material to specific face (front face is index 4 in BoxGeometry)
  if (Array.isArray(horseMesh.material)) {
    horseMesh.material[4] = faceMaterial;
  } else {
    // Convert to array of materials
    const originalMaterial = horseMesh.material;
    horseMesh.material = [
      originalMaterial.clone(),
      originalMaterial.clone(),
      originalMaterial.clone(),
      originalMaterial.clone(),
      faceMaterial, // Front face
      originalMaterial.clone(),
    ];
  }
}

/**
 * Apply angry face texture to the front of the cube
 */
export function applyAngryFaceTexture(horseMesh: THREE.Mesh): void {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Get the horse's color from the material
  const horseMaterial = Array.isArray(horseMesh.material)
    ? horseMesh.material[0]
    : horseMesh.material;
  const horseColor = (horseMaterial as THREE.MeshLambertMaterial).color;

  // Fill background with horse color (slightly darker to match shading)
  const darkerColor = horseColor.clone().multiplyScalar(0.85);
  ctx.fillStyle = `#${darkerColor.getHexString()}`;
  ctx.fillRect(0, 0, 256, 256);

  // Draw angry eyebrows
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 6;
  // Left eyebrow (angled down)
  ctx.beginPath();
  ctx.moveTo(50, 75);
  ctx.lineTo(100, 85);
  ctx.stroke();
  // Right eyebrow (angled down)
  ctx.beginPath();
  ctx.moveTo(156, 85);
  ctx.lineTo(206, 75);
  ctx.stroke();

  // Draw angry eyes (narrowed)
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(80, 100, 12, 0, Math.PI * 2);
  ctx.arc(176, 100, 12, 0, Math.PI * 2);
  ctx.fill();

  // Draw frown
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(128, 170, 50, Math.PI + 0.2, Math.PI * 2 - 0.2);
  ctx.stroke();

  // Create texture and apply to front face
  const texture = new THREE.CanvasTexture(canvas);
  const faceMaterial = new THREE.MeshLambertMaterial({
    map: texture,
  });

  // Apply material to specific face
  if (Array.isArray(horseMesh.material)) {
    horseMesh.material[4] = faceMaterial;
  } else {
    const originalMaterial = horseMesh.material;
    horseMesh.material = [
      originalMaterial.clone(),
      originalMaterial.clone(),
      originalMaterial.clone(),
      originalMaterial.clone(),
      faceMaterial,
      originalMaterial.clone(),
    ];
  }
}

/**
 * Apply shocked face texture to the front of the cube
 */
export function applyShockedFaceTexture(horseMesh: THREE.Mesh): void {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Get the horse's color from the material
  const horseMaterial = Array.isArray(horseMesh.material)
    ? horseMesh.material[0]
    : horseMesh.material;
  const horseColor = (horseMaterial as THREE.MeshLambertMaterial).color;

  // Fill background with horse color (slightly darker to match shading)
  const darkerColor = horseColor.clone().multiplyScalar(0.85);
  ctx.fillStyle = `#${darkerColor.getHexString()}`;
  ctx.fillRect(0, 0, 256, 256);

  // Draw wide shocked eyes
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 5;
  ctx.fillStyle = "#ffffff";
  // Left eye
  ctx.beginPath();
  ctx.arc(80, 95, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Right eye
  ctx.beginPath();
  ctx.arc(176, 95, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils (small dots)
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(80, 95, 10, 0, Math.PI * 2);
  ctx.arc(176, 95, 10, 0, Math.PI * 2);
  ctx.fill();

  // Open mouth (O shape)
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 145, 20, 0, Math.PI * 2);
  ctx.fill();

  // Create texture and apply to front face
  const texture = new THREE.CanvasTexture(canvas);
  const faceMaterial = new THREE.MeshLambertMaterial({
    map: texture,
  });

  // Apply material to specific face
  if (Array.isArray(horseMesh.material)) {
    horseMesh.material[4] = faceMaterial;
  } else {
    const originalMaterial = horseMesh.material;
    horseMesh.material = [
      originalMaterial.clone(),
      originalMaterial.clone(),
      originalMaterial.clone(),
      originalMaterial.clone(),
      faceMaterial,
      originalMaterial.clone(),
    ];
  }
}

/**
 * Create a 3D red nose that sticks out from the front of the cube
 * @param cubeDepth - The depth of the cube to position the nose on (default 1.0 for horse)
 */
export function createRedNose(cubeDepth: number = 1.0): THREE.Mesh {
  const noseGeometry = new THREE.SphereGeometry(0.12, 8, 8);
  const noseMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);

  // Position nose on front center of cube
  nose.position.set(0, 0, cubeDepth / 2 + 0.06); // Front face + half nose radius

  return nose;
}

/**
 * Create 3D glasses that sit on the front of the cube
 * @param cubeDepth - The depth of the cube to position the glasses on (default 1.0 for horse)
 */
export function createGlasses(cubeDepth: number = 1.0): THREE.Group {
  const glassesGroup = new THREE.Group();
  const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const lensMaterial = new THREE.MeshLambertMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.3,
  });

  const frontZ = cubeDepth / 2 + 0.05;
  const eyeY = 0.08; // Slight upward offset to align with eyes

  // Left lens frame (torus)
  const leftFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.02, 6, 8),
    frameMaterial,
  );
  leftFrame.position.set(-0.2, eyeY, frontZ);

  // Right lens frame
  const rightFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.02, 6, 8),
    frameMaterial,
  );
  rightFrame.position.set(0.2, eyeY, frontZ);

  // Bridge connecting the lenses
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6),
    frameMaterial,
  );
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, eyeY, frontZ);

  // Left lens
  const leftLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.14, 8),
    lensMaterial,
  );
  leftLens.position.set(-0.2, eyeY, frontZ + 0.01);

  // Right lens
  const rightLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.14, 8),
    lensMaterial,
  );
  rightLens.position.set(0.2, eyeY, frontZ + 0.01);

  glassesGroup.add(leftFrame, rightFrame, bridge, leftLens, rightLens);
  return glassesGroup;
}
