import * as THREE from "three";
import {
  applyHappyFaceTexture,
  applyInnocentEyesTexture,
  applyAngryFaceTexture,
  applyShockedFaceTexture,
  createRedNose,
  createGlasses,
} from "../accessories";

/**
 * Creates a spectator model - a cuboid with random color, hat, and face
 * @returns Object containing the spectator group and references needed for animation
 */
export function createSpectator(): {
  group: THREE.Group;
  topCube: THREE.Mesh;
  bottomCube: THREE.Mesh;
} {
  const spectatorGroup = new THREE.Group();

  // Random color for the spectator body
  const colors = [
    0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b, 0xeb4d4b, 0x6c5ce7,
    0xa29bfe, 0xfd79a8, 0xe17055, 0x00b894, 0x00cec9, 0x0984e3, 0x6c5ce7,
    0xfdcb6e,
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];

  // Body dimensions (small to fit on bleachers)
  // Two cubes stacked: height = 2 * width
  const bodyWidth = 0.3;
  const cubeSize = 0.3; // Each half is a cube
  const bodyDepth = 0.2;

  // Create bottom half (legs/lower body)
  const bottomGeometry = new THREE.BoxGeometry(bodyWidth, cubeSize, bodyDepth);
  const bottomMaterial = new THREE.MeshLambertMaterial({ color });
  const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);
  bottomMesh.position.y = -cubeSize / 2; // Position bottom half below center
  bottomMesh.castShadow = true;
  spectatorGroup.add(bottomMesh);

  // Create top half (head/upper body) with face
  const topGeometry = new THREE.BoxGeometry(bodyWidth, cubeSize, bodyDepth);
  const topMaterial = new THREE.MeshLambertMaterial({ color });
  const topMesh = new THREE.Mesh(topGeometry, topMaterial);
  topMesh.position.y = cubeSize / 2; // Position top half above center
  topMesh.castShadow = true;
  spectatorGroup.add(topMesh);

  // Randomly choose and apply a face texture to the top half only
  const faceTypes = [
    applyHappyFaceTexture,
    applyInnocentEyesTexture,
    applyAngryFaceTexture,
    applyShockedFaceTexture,
  ];
  const faceType = faceTypes[Math.floor(Math.random() * faceTypes.length)];
  faceType(topMesh);

  // Randomly add face accessories (30% chance each)
  // Add them as children to topMesh so they follow the top half position
  if (Math.random() < 0.3) {
    const redNose = createRedNose(1.0); // Use default positioning
    redNose.scale.set(0.3, 0.3, 0.3);
    // After scaling, reposition to front of small cube
    redNose.position.z = bodyDepth / 2 + 0.02;
    topMesh.add(redNose);
  }

  if (Math.random() < 0.3) {
    const glasses = createGlasses(1.0); // Use default positioning
    // First, move all children to be centered at origin (subtract their existing Z offset)
    const originalZ = 0.52; // The original Z position from createGlasses for 1.0 cube
    glasses.children.forEach((child) => {
      child.position.z -= originalZ;
    });
    // Now scale and position as a unit
    glasses.scale.set(0.3, 0.3, 0.3);
    glasses.position.set(0, 0.02, bodyDepth / 2 + 0.02); // Small Y offset for spectator alignment
    topMesh.add(glasses);
  }

  return {
    group: spectatorGroup,
    topCube: topMesh,
    bottomCube: bottomMesh,
  };
}
