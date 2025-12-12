import * as THREE from 'three';
import './style.css';
import { RaceTrack } from './raceTrack';
import { CameraController, CameraMode } from './cameraController';
import { DebugOverlay } from './debugOverlay';
import { RaceManager } from './raceManager';
import { HorseEditor } from './horseEditor';
import { LeaderboardOverlay } from './leaderboardOverlay';
import { RidersOverlay } from './ridersOverlay';
import { PodiumScene } from './podiumScene';
import { PhotoFinish } from './photoFinish';
import type { HorseData } from './horseStats';

// Screen state management
const ScreenState = {
  MAIN: 'main',
  RIDERS: 'riders',
  PODIUM: 'podium'
} as const;

type ScreenState = typeof ScreenState[keyof typeof ScreenState];

let currentScreen: ScreenState = ScreenState.MAIN;

// Track overlay states for restoring when returning to main screen
let wasEditorOpen = false;
let wasLeaderboardOpen = true;

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

// Initialize leaderboard overlay
const leaderboardOverlay = new LeaderboardOverlay();

// Initialize riders overlay
const ridersOverlay = new RidersOverlay();

// Initialize podium scene
const podiumScene = new PodiumScene(camera);

// Initialize photo finish system
const photoFinish = new PhotoFinish();

// Initialize horse editor
const trackLength = raceManager.getTrackLength();
const horseEditor = new HorseEditor(trackLength);

// Listen for horse changes
horseEditor.onHorsesChange((horses: HorseData[]) => {
  const raceSeed = horseEditor.getRaceSeed();
  raceManager.setHorses(horses, raceSeed);
  raceManager.resetRace();
});

// Set up photo finish callback
raceManager.setPhotoFinishCallback(() => {
  // Get finish line camera view
  const getFinishLineCameraView = () => {
    const finishLinePos = raceTrack.getTrackPosition(0, 6);
    const sideOffset = 10;
    return {
      position: new THREE.Vector3(finishLinePos.x, 6, finishLinePos.z + sideOffset),
      lookAt: new THREE.Vector3(finishLinePos.x, 1.5, finishLinePos.z)
    };
  };

  photoFinish.capture(scene, renderer, getFinishLineCameraView);
});

// Keyboard controls
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  // Debug overlay toggle
  if (key === 'd') {
    debugOverlay.toggle();
    return;
  }

  // Show riders screen with 'Q' (only when not racing)
  if (key === 'q') {
    if (currentScreen === ScreenState.MAIN && !raceManager.isRacing()) {
      // Save overlay states
      wasEditorOpen = horseEditor.isEditorOpen();
      wasLeaderboardOpen = leaderboardOverlay.isShown();

      currentScreen = ScreenState.RIDERS;
      ridersOverlay.update(horseEditor.getHorses());
      ridersOverlay.show();
      horseEditor.hide();
      leaderboardOverlay.hide();
      console.log('Showing riders roster...');
    }
    return;
  }

  // Show podium screen with 'W'
  if (key === 'w') {
    if (currentScreen !== ScreenState.PODIUM) {
      // Save overlay states if coming from main screen
      if (currentScreen === ScreenState.MAIN) {
        wasEditorOpen = horseEditor.isEditorOpen();
        wasLeaderboardOpen = leaderboardOverlay.isShown();
      }

      // Stop race if currently racing
      if (raceManager.isRacing()) {
        raceManager.stopRace();
      }

      const horses = raceManager.getHorses();
      if (horses.length >= 3) {
        currentScreen = ScreenState.PODIUM;
        const leaderboard = raceManager.getLeaderboard();
        const topThree = leaderboard.slice(0, 3).map(entry =>
          horses.find(h => h.data.name === entry.name)!
        ).filter(h => h !== undefined);

        podiumScene.show(topThree);
        horseEditor.hide();
        leaderboardOverlay.hide();
        photoFinish.show(); // Show photo finish thumbnail on podium
        console.log('Showing podium...');
      }
    }
    return;
  }

  // Return to main screen with 'A'
  if (key === 'a') {
    if (currentScreen !== ScreenState.MAIN) {
      currentScreen = ScreenState.MAIN;
      ridersOverlay.hide();
      podiumScene.hide();
      photoFinish.hide(); // Hide photo finish thumbnail when leaving podium

      // Restore previous overlay states
      horseEditor.show();
      if (wasEditorOpen) {
        horseEditor.open();
      } else {
        horseEditor.close();
      }

      if (wasLeaderboardOpen) {
        leaderboardOverlay.show();
      } else {
        leaderboardOverlay.hide();
      }

      console.log('Returning to main view...');
    }
    return;
  }

  // Start race with 'P' (only if not racing and horses exist)
  if (key === 'p') {
    if (currentScreen === ScreenState.MAIN && !raceManager.isRacing() && raceManager.getHorses().length > 0) {
      horseEditor.close(); // Close editor during race
      leaderboardOverlay.reset(); // Reset leaderboard
      raceManager.startRace();
      console.log('Race starting...');
    }
    return;
  }

  // Toggle horse editor with 'E'
  if (key === 'e') {
    if (currentScreen === ScreenState.MAIN && !raceManager.isRacing()) {
      horseEditor.toggle();
    }
    return;
  }

  // Toggle leaderboard with 'L'
  if (key === 'l') {
    leaderboardOverlay.toggle();
    return;
  }

  // Reset race with 'R'
  if (key === 'r') {
    if (raceManager.getHorses().length > 0) {
      raceManager.resetRace();
      leaderboardOverlay.reset();
      photoFinish.clear(); // Clear photo finish on race reset
      console.log('Race reset!');
    }
    return;
  }

  // Camera mode switching (disabled when editor is open or not on main screen)
  if (horseEditor.isEditorOpen() || currentScreen !== ScreenState.MAIN) {
    return; // Don't process camera hotkeys when editor is open or not on main screen
  }

  const horses = raceManager.getHorses();
  const leaderboard = raceManager.getLeaderboard();

  if (key === '0') {
    cameraController.setMode(CameraMode.ORBITAL);
    console.log('Camera: Orbital View');
  } else if (key === '9') {
    cameraController.setMode(CameraMode.FOLLOW);
    console.log('Camera: Follow View');
  } else if (key === '-') {
    cameraController.setMode(CameraMode.FINISH_LINE);
    console.log('Camera: Finish Line View');
  } else if (key >= '1' && key <= '8') {
    const horseIndex = parseInt(key) - 1;
    if (horseIndex < horses.length) {
      const isRacing = raceManager.isRacing();
      const leaderboardOrder = leaderboard.map(entry => entry.name);
      cameraController.setMode(CameraMode.HORSE, horseIndex, undefined, isRacing, leaderboardOrder);
      console.log(`Camera: Horse ${key} View`);
    }
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  podiumScene.onWindowResize(window.innerWidth, window.innerHeight);
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

  // Update leaderboard if racing
  if (raceManager.isRacing()) {
    const raceTime = raceManager.getRaceTime();
    const leaderboard = raceManager.getLeaderboard();
    leaderboardOverlay.update(raceTime, leaderboard);
  }

  // Get current horses and their data
  const horses = raceManager.getHorses();
  const horsePositions = horses.map((horse) => horse.mesh.position);
  const trackCenter = new THREE.Vector3(0, 0, 0);

  // Create track position function for camera
  const getTrackPosition = (progress: number, laneOffset?: number) =>
    raceTrack.getTrackPosition(progress, laneOffset);

  // Get lead horse progress for follow camera
  const leadHorseProgress = raceManager.getLeadHorseProgress();

  // Get leaderboard order for camera positioning during race
  const leaderboard = raceManager.getLeaderboard();
  const leaderboardOrderedHorses = leaderboard.map(entry =>
    horses.find(h => h.data.name === entry.name)!
  ).filter(h => h !== undefined);
  const leaderboardPositions = leaderboardOrderedHorses.map(h => h.mesh.position);
  const leaderboardProgress = leaderboardOrderedHorses.map(h => h.progress);
  const horseNames = horses.map(h => h.data.name);
  const leaderboardHorseNames = leaderboardOrderedHorses.map(h => h.data.name);

  // Update camera based on current mode
  cameraController.update(
    raceManager.isRacing() ? leaderboardPositions : horsePositions,
    trackCenter,
    getTrackPosition,
    leadHorseProgress,
    raceManager.isRacing() ? leaderboardProgress : horses.map(h => h.progress),
    raceManager.isRacing(),
    leaderboard.map(entry => entry.name),
    raceManager.isRacing() ? leaderboardHorseNames : horseNames
  );

  // Render appropriate scene based on current screen
  if (currentScreen === ScreenState.PODIUM) {
    podiumScene.update(deltaTime);
    renderer.render(podiumScene.getScene(), podiumScene.getCamera());
  } else {
    renderer.render(scene, camera);
  }
}

animate();
