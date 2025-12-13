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
import { FreeFlyCamera } from './freeFlyCamera';
import { updateSpectatorAnimations, setRaceActive, startCrowdWave, isCrowdWaveActive } from './models/bleachers';
import type { HorseData } from './horseStats';
import { getCurrentTheme, getThemeConfig, type ThemeType } from './themeConfig';

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
const currentTheme = getCurrentTheme();
const themeConfig = getThemeConfig(currentTheme);
scene.background = new THREE.Color(themeConfig.skyColor);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 35, 45);
camera.lookAt(0, 0, 0);
// Enable layer 1 to see start/finish banner and other layer 1 objects
camera.layers.enable(1);

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
const groundGeometry = new THREE.PlaneGeometry(300, 300); // Much larger to hide edges
const groundMaterial = new THREE.MeshStandardMaterial({
  color: themeConfig.groundColor,
  roughness: 0.8,
  metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create the race track
const raceTrack = new RaceTrack({
  length: 60,  // 50% longer straights
  width: 15,   // 25% wider
  radius: 20   // Larger curves
});
raceTrack.setGround(ground); // Pass ground reference for theme updates
scene.add(raceTrack.getGroup());

// Load placeholder image for big screen
const textureLoader = new THREE.TextureLoader();
const placeholderTexture = textureLoader.load(
  '/placeholder.jpeg',
  (texture) => {
    // Texture loaded successfully
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1; // Flip horizontally
    texture.needsUpdate = true;

    // Force update the screen material if big screen exists
    const bigScreen = raceTrack.getBigScreen();
    if (bigScreen) {
      bigScreen.screenMaterial.map = texture;
      bigScreen.screenMaterial.emissiveMap = texture;
      bigScreen.screenMaterial.needsUpdate = true;
    }
  },
  undefined,
  (error) => {
    console.error('Error loading placeholder texture:', error);
  }
);

// Initialize big screen (texture will be applied when loaded)
raceTrack.initializeBigScreen(placeholderTexture);

// Initialize race manager
const raceManager = new RaceManager(raceTrack);

// Initialize camera controller with track config for automatic scaling
const cameraController = new CameraController(camera, raceTrack.getConfig());

// Initialize free fly camera
const freeFlyCamera = new FreeFlyCamera(camera);

// Initialize debug overlay
const debugOverlay = new DebugOverlay();

// Set up theme change callback
debugOverlay.setThemeChangeCallback((newTheme: ThemeType) => {
  const newConfig = getThemeConfig(newTheme);

  // Update scene
  scene.background = new THREE.Color(newConfig.skyColor);

  // Update ground color
  (ground.material as THREE.MeshStandardMaterial).color.setHex(newConfig.groundColor);

  // Update track barriers
  raceTrack.updateTheme(newTheme);
});

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

// Set initial racer banners
const initialHorses = raceManager.getHorses().map(h => h.data);
raceTrack.setRacers(initialHorses);

// Listen for horse changes
horseEditor.onHorsesChange((horses: HorseData[]) => {
  const raceSeed = horseEditor.getRaceSeed();
  raceManager.setHorses(horses, raceSeed);
  raceManager.resetRace();
  raceTrack.setRacers(horses); // Update racer banners on track
  setRaceActive(false); // Return spectators to calm animations when horses change
});

// Set up photo finish callback
raceManager.setPhotoFinishCallback(() => {
  // Get finish line camera view - match the finish line camera settings
  const getFinishLineCameraView = () => {
    const trackConfig = raceTrack.getConfig();
    const finishLinePos = raceTrack.getTrackPosition(0, trackConfig.width / 2);
    const finishLineSideOffset = trackConfig.width * 0.9; // Same as cameraController
    const finishLineCameraHeight = trackConfig.barrierHeight * 3.5; // Same as cameraController
    return {
      position: new THREE.Vector3(finishLinePos.x, finishLineCameraHeight, finishLinePos.z + finishLineSideOffset),
      lookAt: new THREE.Vector3(finishLinePos.x, 0.8, finishLinePos.z)
    };
  };

  photoFinish.capture(scene, renderer, getFinishLineCameraView);
});

// Keyboard controls
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  // Free fly camera toggle with 'F'
  if (key === 'f') {
    freeFlyCamera.toggle();
    return;
  }

  // Trigger crowd wave with 'T' (works in free cam too)
  if (key === 't') {
    if (currentScreen === ScreenState.MAIN && !isCrowdWaveActive()) {
      startCrowdWave();
      console.log('Crowd wave triggered!');
    }
    return;
  }

  // Don't process other controls if free fly camera is active
  if (freeFlyCamera.isActivated()) {
    return;
  }

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
        ridersOverlay.hide(); // Hide riders roster when showing podium
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
      setRaceActive(true); // Activate excited spectator animations
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
      setRaceActive(false); // Return spectators to calm animations
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
  } else if (key === '=' || key === '+') {
    if (cameraController.getCurrentMode() === CameraMode.BANNER) {
      // Already in banner mode, cycle speed
      cameraController.cycleBannerSpeed();
    } else {
      // Switch to banner mode
      cameraController.setMode(CameraMode.BANNER);
      console.log('Camera: Banner View (Slow)');
    }
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

  // Update spectator animations based on race state
  updateSpectatorAnimations(deltaTime);

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

  // Update free fly camera if active, otherwise update normal camera controller
  if (freeFlyCamera.isActivated()) {
    freeFlyCamera.update(deltaTime);
  } else {
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
  }

  // Update big screen follow camera and render to texture
  const bigScreen = raceTrack.getBigScreen();
  if (bigScreen) {
    if (horses.length > 0) {
      // Update the follow camera for the big screen
      bigScreen.updateFollowCamera(
        raceManager.isRacing() ? leaderboardPositions : horsePositions,
        getTrackPosition,
        leadHorseProgress
      );

      // Render the follow camera view to the render target
      renderer.setRenderTarget(bigScreen.renderTarget);
      renderer.render(scene, bigScreen.followCamera);
      renderer.setRenderTarget(null); // Reset to default framebuffer

      // Update screen material to show the rendered texture
      bigScreen.screenMaterial.map = bigScreen.renderTarget.texture;
      bigScreen.screenMaterial.emissiveMap = bigScreen.renderTarget.texture;
      bigScreen.screenMaterial.needsUpdate = true;
    } else {
      // Show placeholder when no horses
      if (bigScreen.screenMaterial.map !== placeholderTexture) {
        bigScreen.screenMaterial.map = placeholderTexture;
        bigScreen.screenMaterial.emissiveMap = placeholderTexture;
        bigScreen.screenMaterial.needsUpdate = true;
      }
    }
  }

  // Render appropriate scene based on current screen
  if (currentScreen === ScreenState.PODIUM) {
    podiumScene.update(deltaTime);
    renderer.render(podiumScene.getScene(), podiumScene.getCamera());
  } else {
    renderer.render(scene, camera);
  }
}

animate();
