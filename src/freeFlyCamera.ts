import * as THREE from "three";

export class FreeFlyCamera {
  private camera: THREE.PerspectiveCamera;
  private isActive: boolean = false;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private keys: Set<string> = new Set();

  // Movement settings
  private readonly BASE_SPEED = 20;
  private readonly SPRINT_MULTIPLIER = 3;
  private readonly MOUSE_SENSITIVITY = 0.002; // Adjust this for sensitivity
  private readonly VELOCITY_DAMPING = 0.85;
  private readonly DOUBLE_TAP_WINDOW = 300; // ms window for double-tap detection

  // Sprint state
  private isSprinting: boolean = false;
  private lastWPressTime: number = 0;

  // Camera rotation
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, "YXZ");
  private pointerLocked: boolean = false;

  // World bounds
  private readonly MIN_Y = 0.5; // Don't go below ground
  private readonly WORLD_BOUNDS = 200; // Stay within ±200 units from center

  // State to restore
  private previousPosition: THREE.Vector3 = new THREE.Vector3();
  private previousRotation: THREE.Euler = new THREE.Euler();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("keyup", this.onKeyUp.bind(this));

    // Mouse events
    document.addEventListener("mousemove", this.onMouseMove.bind(this));

    // Pointer lock events
    document.addEventListener(
      "pointerlockchange",
      this.onPointerLockChange.bind(this),
    );
    document.addEventListener(
      "pointerlockerror",
      this.onPointerLockError.bind(this),
    );
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.isActive) return;
    const key = event.key.toLowerCase();

    // Detect double-tap W for sprint (ignore key repeat events)
    if (key === "w" && !this.keys.has("w")) {
      const currentTime = performance.now();
      if (currentTime - this.lastWPressTime < this.DOUBLE_TAP_WINDOW) {
        this.isSprinting = true;
      }
      this.lastWPressTime = currentTime;
    }

    this.keys.add(key);
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (!this.isActive) return;
    const key = event.key.toLowerCase();

    // Reset sprint when W is released
    if (key === "w") {
      this.isSprinting = false;
    }

    this.keys.delete(key);
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isActive || !this.pointerLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= movementX * this.MOUSE_SENSITIVITY;
    this.euler.x -= movementY * this.MOUSE_SENSITIVITY;

    // Clamp vertical rotation to prevent flipping
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  private onPointerLockChange(): void {
    this.pointerLocked = document.pointerLockElement === document.body;
  }

  private onPointerLockError(): void {
    console.error("Pointer lock error");
  }

  private requestPointerLock(): void {
    document.body.requestPointerLock();
  }

  private exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public activate(): void {
    if (this.isActive) return;

    // Store current camera state
    this.previousPosition.copy(this.camera.position);
    this.previousRotation.copy(this.camera.rotation);

    // Reset velocity
    this.velocity.set(0, 0, 0);
    this.keys.clear();

    // Set initial rotation for mouse look
    this.euler.setFromQuaternion(this.camera.quaternion);

    // Request pointer lock
    this.requestPointerLock();

    this.isActive = true;
    console.log("Free fly camera activated");
  }

  public deactivate(): void {
    if (!this.isActive) return;

    // Exit pointer lock
    this.exitPointerLock();

    // Clear movement and sprint state
    this.velocity.set(0, 0, 0);
    this.keys.clear();
    this.isSprinting = false;

    this.isActive = false;
    console.log("Free fly camera deactivated");
  }

  public toggle(): void {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    // Calculate movement direction
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    // Get camera forward and right vectors
    this.camera.getWorldDirection(forward);
    right.crossVectors(forward, this.camera.up).normalize();

    // Determine sprint multiplier (active only when W is held and double-tapped)
    const speed =
      this.BASE_SPEED * (this.isSprinting ? this.SPRINT_MULTIPLIER : 1);

    // Forward/Back (W/S)
    if (this.keys.has("w")) {
      direction.add(forward);
    }
    if (this.keys.has("s")) {
      direction.sub(forward);
    }

    // Left/Right (A/D)
    if (this.keys.has("a")) {
      direction.sub(right);
    }
    if (this.keys.has("d")) {
      direction.add(right);
    }

    // Up/Down (Space/Shift) - world space, not camera relative
    if (this.keys.has(" ")) {
      direction.y += 1;
    }
    if (this.keys.has("shift")) {
      direction.y -= 1;
    }

    // Normalize direction to prevent faster diagonal movement
    if (direction.length() > 0) {
      direction.normalize();
    }

    // Apply velocity with smooth interpolation
    const targetVelocity = direction.multiplyScalar(speed);
    this.velocity.lerp(targetVelocity, 1 - this.VELOCITY_DAMPING);

    // Calculate new position
    const newPosition = this.camera.position.clone();
    newPosition.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Apply world bounds constraints
    newPosition.x = Math.max(
      -this.WORLD_BOUNDS,
      Math.min(this.WORLD_BOUNDS, newPosition.x),
    );
    newPosition.z = Math.max(
      -this.WORLD_BOUNDS,
      Math.min(this.WORLD_BOUNDS, newPosition.z),
    );
    newPosition.y = Math.max(
      this.MIN_Y,
      Math.min(this.WORLD_BOUNDS, newPosition.y),
    );

    // Check if we hit a boundary and zero velocity on that axis
    if (
      newPosition.x === -this.WORLD_BOUNDS ||
      newPosition.x === this.WORLD_BOUNDS
    ) {
      this.velocity.x = 0;
    }
    if (
      newPosition.z === -this.WORLD_BOUNDS ||
      newPosition.z === this.WORLD_BOUNDS
    ) {
      this.velocity.z = 0;
    }
    if (newPosition.y === this.MIN_Y || newPosition.y === this.WORLD_BOUNDS) {
      this.velocity.y = 0;
    }

    // Update camera position
    this.camera.position.copy(newPosition);
  }

  public isActivated(): boolean {
    return this.isActive;
  }

  public getPreviousPosition(): THREE.Vector3 {
    return this.previousPosition.clone();
  }

  public getPreviousRotation(): THREE.Euler {
    return this.previousRotation.clone();
  }
}
