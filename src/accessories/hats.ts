import * as THREE from 'three';

/**
 * Creates horse ears - two triangle cones on the sides
 */
export function createHorseEars(horseColor: number): THREE.Mesh[] {
  const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 3); // Low-poly triangle cone
  const earMaterial = new THREE.MeshLambertMaterial({ color: horseColor });

  // Left ear
  const leftEar = new THREE.Mesh(earGeometry, earMaterial);
  leftEar.position.set(-0.3, 0.15, 0.1);
  leftEar.rotation.z = -Math.PI / 8; // Slight outward tilt

  // Right ear
  const rightEar = new THREE.Mesh(earGeometry, earMaterial);
  rightEar.position.set(0.3, 0.15, 0.1);
  rightEar.rotation.z = Math.PI / 8; // Slight outward tilt

  return [leftEar, rightEar];
}

/**
 * Creates reindeer antlers - branching cylinders
 */
export function createReindeerAntlers(): THREE.Mesh[] {
  const antlers: THREE.Mesh[] = [];
  const antlerMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // Brown

  // Left antler
  const leftMain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4),
    antlerMaterial
  );
  leftMain.position.set(-0.25, 0.3, 0);
  leftMain.rotation.z = Math.PI / 6;
  antlers.push(leftMain);

  // Left branches
  const leftBranch1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.25, 4),
    antlerMaterial
  );
  leftBranch1.position.set(-0.35, 0.45, 0);
  leftBranch1.rotation.z = Math.PI / 3;
  antlers.push(leftBranch1);

  const leftBranch2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.2, 4),
    antlerMaterial
  );
  leftBranch2.position.set(-0.3, 0.55, 0);
  leftBranch2.rotation.z = Math.PI / 4;
  antlers.push(leftBranch2);

  // Right antler (mirror of left)
  const rightMain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4),
    antlerMaterial
  );
  rightMain.position.set(0.25, 0.3, 0);
  rightMain.rotation.z = -Math.PI / 6;
  antlers.push(rightMain);

  // Right branches
  const rightBranch1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.25, 4),
    antlerMaterial
  );
  rightBranch1.position.set(0.35, 0.45, 0);
  rightBranch1.rotation.z = -Math.PI / 3;
  antlers.push(rightBranch1);

  const rightBranch2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.2, 4),
    antlerMaterial
  );
  rightBranch2.position.set(0.3, 0.55, 0);
  rightBranch2.rotation.z = -Math.PI / 4;
  antlers.push(rightBranch2);

  return antlers;
}

/**
 * Creates a top hat - cylinder with brim
 */
export function createTopHat(): THREE.Mesh[] {
  const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // Black

  // Hat body (tall cylinder)
  const hatBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8),
    hatMaterial
  );
  hatBody.position.set(0, 0.25, 0);

  // Hat brim (flat disc)
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8),
    hatMaterial
  );
  brim.position.set(0, 0, 0);

  return [brim, hatBody];
}

/**
 * Creates a crown - low-poly crown with points
 */
export function createCrown(): THREE.Mesh[] {
  const crownMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 }); // Gold

  // Crown base (short cylinder)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8),
    crownMaterial
  );
  base.position.set(0, 0.075, 0);

  // Crown points (4 small cones around the top)
  const points: THREE.Mesh[] = [];
  const pointGeometry = new THREE.ConeGeometry(0.1, 0.25, 4);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const point = new THREE.Mesh(pointGeometry, crownMaterial);
    const radius = 0.25;
    point.position.set(
      Math.cos(angle) * radius,
      0.25,
      Math.sin(angle) * radius
    );
    points.push(point);
  }

  return [base, ...points];
}

/**
 * Creates a propeller hat - colorful segmented beanie with propeller on top
 */
export function createPropellerHat(): THREE.Mesh[] {
  const segments: THREE.Mesh[] = [];
  const colors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00]; // Red, Blue, Green, Yellow
  const segmentCount = 4;
  const anglePerSegment = (Math.PI * 2) / segmentCount;

  // Create colorful segments using cones
  for (let i = 0; i < segmentCount; i++) {
    const segmentGeometry = new THREE.ConeGeometry(0.35, 0.3, segmentCount, 1, false, i * anglePerSegment, anglePerSegment);
    const segmentMaterial = new THREE.MeshLambertMaterial({ color: colors[i] });
    const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
    segment.position.set(0, 0.15, 0);
    segments.push(segment);
  }

  // Propeller blades (two elongated boxes)
  const propellerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const blade1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.02, 0.08),
    propellerMaterial
  );
  blade1.position.set(0, 0.32, 0);

  const blade2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.02, 0.5),
    propellerMaterial
  );
  blade2.position.set(0, 0.32, 0);

  // Center knob
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 6, 6),
    propellerMaterial
  );
  knob.position.set(0, 0.35, 0);

  return [...segments, blade1, blade2, knob];
}
