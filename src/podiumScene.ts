import * as THREE from "three";
import { FONT } from "./constants";
import type { Horse } from "./raceManager";

interface Confetti {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
}

export class PodiumScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private podiumObjects: THREE.Object3D[] = [];
  private confettiParticles: Confetti[] = [];
  private isVisible: boolean = false;
  private originalCameraPosition?: THREE.Vector3;
  private originalCameraRotation?: THREE.Euler;
  private mainCamera: THREE.PerspectiveCamera;

  constructor(mainCamera: THREE.PerspectiveCamera) {
    this.mainCamera = mainCamera;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.createConfetti();

    // Camera for podium view
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 2, 0);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);

    this.createPodiums();
  }

  private createPodiums(): void {
    // Podium positions: center (1st - tallest), left (2nd), right (3rd)
    const podiumData = [
      {
        position: new THREE.Vector3(-5, 1.5, 0),
        height: 3,
        color: 0xc0c0c0,
        label: "2nd",
      }, // Silver (left)
      {
        position: new THREE.Vector3(0, 2, 0),
        height: 4,
        color: 0xffd700,
        label: "1st",
      }, // Gold (center)
      {
        position: new THREE.Vector3(5, 1, 0),
        height: 2,
        color: 0xcd7f32,
        label: "3rd",
      }, // Bronze (right)
    ];

    podiumData.forEach((data) => {
      // Create podium block
      const geometry = new THREE.BoxGeometry(4, data.height, 4);
      const material = new THREE.MeshStandardMaterial({
        color: data.color,
        metalness: 0.6,
        roughness: 0.4,
      });
      const podium = new THREE.Mesh(geometry, material);
      podium.position.copy(data.position);
      podium.castShadow = true;
      podium.receiveShadow = true;
      this.scene.add(podium);
      this.podiumObjects.push(podium);

      // Create label
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = 256;
      canvas.height = 128;
      context.fillStyle = "#ffffff";
      context.font = `bold 60px ${FONT}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(data.label, 128, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const labelGeometry = new THREE.PlaneGeometry(2, 1);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(
        data.position.x,
        data.position.y + data.height / 2 + 0.6,
        data.position.z + 2.1,
      );
      this.scene.add(label);
      this.podiumObjects.push(label);
    });

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.podiumObjects.push(ground);
  }

  private createConfetti(): void {
    // Create colorful confetti particles
    const colors = [
      0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xff8b94, 0xc7ceea, 0xffd3b6,
    ];
    const confettiCount = 200;

    for (let i = 0; i < confettiCount; i++) {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.02);
      const material = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        metalness: 0.3,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Random starting position above the scene
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        15 + Math.random() * 5,
        (Math.random() - 0.5) * 20,
      );

      this.scene.add(mesh);

      this.confettiParticles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -2 - Math.random() * 2,
          (Math.random() - 0.5) * 2,
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
        ),
      });
    }
  }

  private createNameLabel(name: string): THREE.Sprite {
    // Create canvas for text
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

    // Set up text style first to measure
    context.font = `bold 32px ${FONT}`;
    const metrics = context.measureText(name);
    const textWidth = metrics.width;
    const padding = 20; // Padding on each side

    // Set canvas dimensions based on text width
    canvas.width = textWidth + padding * 2;
    canvas.height = 64;

    // Re-apply text style after resizing canvas
    context.font = `bold 32px ${FONT}`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Draw background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.fillStyle = "#ffffff";
    context.fillText(name, canvas.width / 2, canvas.height / 2);

    // Create sprite from canvas texture
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    // Scale width proportionally to canvas width (base scale is for 256px width = 2 units)
    const widthScale = (canvas.width / 256) * 2;
    sprite.scale.set(widthScale, 0.5, 1);

    return sprite;
  }

  public show(topThree: Horse[]): void {
    if (topThree.length === 0) {
      console.warn("No horses to display on podium");
      return;
    }

    // Store original camera state
    this.originalCameraPosition = this.mainCamera.position.clone();
    this.originalCameraRotation = this.mainCamera.rotation.clone();

    // Clear any existing horse meshes and labels from podium scene
    this.scene.children.forEach((child) => {
      if (child.userData.isPodiumHorse || child.userData.isPodiumNameLabel) {
        this.scene.remove(child);
      }
    });

    // Position horses on podiums
    // Order: 2nd (left), 1st (center), 3rd (right)
    const positions = [
      { index: 1, x: -5, y: 4.5 }, // 2nd place on left podium
      { index: 0, x: 0, y: 6 }, // 1st place on center podium (tallest)
      { index: 2, x: 5, y: 3 }, // 3rd place on right podium
    ];

    positions.forEach((pos) => {
      if (pos.index < topThree.length) {
        const horse = topThree[pos.index];
        // Clone the horse mesh for the podium
        const horseMesh = horse.mesh.clone();
        horseMesh.position.set(pos.x, pos.y, 0);
        horseMesh.rotation.y = -Math.PI / 2; // Start rotated -90 degrees (270 degrees) to face forward
        horseMesh.userData.isPodiumHorse = true;
        this.scene.add(horseMesh);

        // Add name label above horse
        const nameLabel = this.createNameLabel(horse.data.name);
        nameLabel.position.set(pos.x, pos.y + 2.2, 0);
        nameLabel.userData.isPodiumNameLabel = true;
        this.scene.add(nameLabel);
      }
    });

    this.isVisible = true;
  }

  public update(deltaTime: number): void {
    if (!this.isVisible) return;

    // Rotate horses slowly
    this.scene.children.forEach((child) => {
      if (child.userData.isPodiumHorse) {
        child.rotation.y += deltaTime * 0.5; // Slow rotation
      }
    });

    // Update confetti
    this.confettiParticles.forEach((confetti) => {
      // Apply velocity
      confetti.mesh.position.add(
        confetti.velocity.clone().multiplyScalar(deltaTime),
      );

      // Apply rotation
      confetti.mesh.rotation.x += confetti.rotationSpeed.x * deltaTime;
      confetti.mesh.rotation.y += confetti.rotationSpeed.y * deltaTime;
      confetti.mesh.rotation.z += confetti.rotationSpeed.z * deltaTime;

      // Reset confetti when it falls below ground
      if (confetti.mesh.position.y < -2) {
        confetti.mesh.position.set(
          (Math.random() - 0.5) * 20,
          15 + Math.random() * 5,
          (Math.random() - 0.5) * 20,
        );
        confetti.velocity.set(
          (Math.random() - 0.5) * 2,
          -2 - Math.random() * 2,
          (Math.random() - 0.5) * 2,
        );
      }
    });
  }

  public hide(): void {
    // Restore original camera state
    if (this.originalCameraPosition && this.originalCameraRotation) {
      this.mainCamera.position.copy(this.originalCameraPosition);
      this.mainCamera.rotation.copy(this.originalCameraRotation);
    }

    // Remove podium horses and labels from scene
    this.scene.children.forEach((child) => {
      if (child.userData.isPodiumHorse || child.userData.isPodiumNameLabel) {
        this.scene.remove(child);
      }
    });

    this.isVisible = false;
  }

  public isShown(): boolean {
    return this.isVisible;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  public dispose(): void {
    // Clean up geometries and materials
    this.podiumObjects.forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
    });

    this.podiumObjects = [];
  }

  public onWindowResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
