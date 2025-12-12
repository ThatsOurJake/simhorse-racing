import * as THREE from 'three';
import './style.css';
import { RaceTrack } from './raceTrack';
import { CameraController, CameraMode } from './cameraController';
import { DebugOverlay } from './debugOverlay';
import { RaceManager } from './raceManager';
import { HorseEditor } from './horseEditor';
import type { HorseData } from './horseStats';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 35, 45);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// Ground plane (grass around the track)
const groundGeometry = new THREE.PlaneGeometry(150, 150);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x228b22,
  roughness: 0.8,
  metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create the race track
const raceTrack = new RaceTrack();
scene.add(raceTrack.getGroup());

// Initialize race manager
const raceManager = new RaceManager(raceTrack);

// Initialize camera controller
const cameraController = new CameraController(camera);

// Initialize debug overlay
const debugOverlay = new DebugOverlay();

// Initialize horse editor
const trackLength = raceManager.getTrackLength();
const horseEditor = new HorseEditor(trackLength);

// Listen for horse changes
horseEditor.onHorsesChange((horses: HorseData[]) => {
  const raceSeed = horseEditor.getRaceSeed();
  raceManager.setHorses(horses, raceSeed);
  raceManager.resetRace();
});

// Keyboard controls
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  // Debug overlay toggle
  if (key === 'd') {
    debugOverlay.toggle();
    return;
  }

  // Start race with 'P' (only if not racing and horses exist)
  if (key === 'p') {
    if (!raceManager.isRacing() && raceManager.getHorses().length > 0) {
      horseEditor.close(); // Close editor during race
      raceManager.startRace();
      console.log('Race starting...');
    }
    return;
  }

  // Toggle horse editor with 'E'
  if (key === 'e') {
    if (!raceManager.isRacing()) {
      horseEditor.toggle();
    }
    return;
  }

  // Camera mode switching (disabled when editor is open)
  if (horseEditor.isEditorOpen()) {
    return; // Don't process camera hotkeys when editor is open
  }

  const horses = raceManager.getHorses();

  if (key === '0') {
    cameraController.setMode(CameraMode.ORBITAL);
    console.log('Camera: Orbital View');
  } else if (key === '9') {
    cameraController.setMode(CameraMode.FOLLOW);
    console.log('Camera: Follow View');
  } else if (key >= '1' && key <= '8') {
    const horseIndex = parseInt(key) - 1;
    if (horseIndex < horses.length) {
      cameraController.setMode(CameraMode.HORSE, horseIndex);
      console.log(`Camera: Horse ${key} View`);
    }
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  // Calculate delta time
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update race (moves horses)
  raceManager.update(deltaTime);

  // Get current horses and their data
  const horses = raceManager.getHorses();
  const horsePositions = horses.map((horse) => horse.mesh.position);
  const trackCenter = new THREE.Vector3(0, 0, 0);

  // Create track position function for camera
  const getTrackPosition = (progress: number, laneOffset?: number) =>
    raceTrack.getTrackPosition(progress, laneOffset);

  // Get lead horse progress for follow camera
  const leadHorseProgress = raceManager.getLeadHorseProgress();

  // Get all horse progress for individual horse cameras
  const horseProgressList = raceManager.getHorseProgressList();

  // Update camera based on current mode
  cameraController.update(
    horsePositions,
    trackCenter,
    getTrackPosition,
    leadHorseProgress,
    horseProgressList
  );

  renderer.render(scene, camera);
}

animate();
