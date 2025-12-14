import * as THREE from "three";
import type { HatType, FaceType } from "./horseStats";
import {
  createHorseEars,
  createReindeerAntlers,
  createTopHat,
  createCrown,
  createPropellerHat,
  applyHappyFaceTexture,
  applyInnocentEyesTexture,
  applyAngryFaceTexture,
  applyShockedFaceTexture,
  createRedNose,
  createGlasses,
} from "./accessories";

/**
 * Creates a hat mesh based on the hat type
 */
export function createHat(type: HatType, horseColor: number): THREE.Group {
  const hatGroup = new THREE.Group();

  switch (type) {
    case "horse-ears":
      hatGroup.add(...createHorseEars(horseColor));
      break;
    case "reindeer-antlers":
      hatGroup.add(...createReindeerAntlers());
      break;
    case "top-hat":
      hatGroup.add(...createTopHat());
      break;
    case "crown":
      hatGroup.add(...createCrown());
      break;
    case "propeller-hat":
      hatGroup.add(...createPropellerHat());
      break;
  }

  // Position hat on top of cube (cube is 1x1x1, centered at origin)
  hatGroup.position.y = 0.5; // Top of cube

  return hatGroup;
}

/**
 * Creates face accessories/textures based on face type
 * For canvas-based faces, this creates a texture applied to the front of the cube
 * For 3D faces (like red nose), this creates mesh objects
 */
export function createFace(
  type: FaceType,
  horseMesh: THREE.Mesh,
): THREE.Object3D[] {
  const accessories: THREE.Object3D[] = [];

  switch (type) {
    case "happy":
      applyHappyFaceTexture(horseMesh);
      break;
    case "innocent":
      applyInnocentEyesTexture(horseMesh);
      break;
    case "red-nose":
      applyInnocentEyesTexture(horseMesh); // Eyes for context
      accessories.push(createRedNose());
      break;
    case "angry":
      applyAngryFaceTexture(horseMesh);
      break;
    case "shocked":
      applyShockedFaceTexture(horseMesh);
      break;
    case "glasses":
      applyInnocentEyesTexture(horseMesh); // Eyes for context
      accessories.push(createGlasses());
      break;
  }

  return accessories;
}
