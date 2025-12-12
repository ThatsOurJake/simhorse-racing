import * as THREE from 'three';

export interface RaceTrackConfig {
  length: number;        // Length of straight sections
  width: number;         // Width of the racing surface
  radius: number;        // Radius of the curved ends
  barrierHeight: number; // Height of barriers
  barrierThickness: number; // Thickness of barrier walls
}

export class RaceTrack {
  private group: THREE.Group;
  private config: RaceTrackConfig;

  constructor(config?: Partial<RaceTrackConfig>) {
    this.config = {
      length: 40,
      width: 12,
      radius: 15,
      barrierHeight: 2,
      barrierThickness: 0.3,
      ...config
    };

    this.group = new THREE.Group();
    this.createTrack();
    this.createBarriers();
  }

  private createTrack(): void {
    const trackColor = 0xc19a6b; // Sandy brown color
    const material = new THREE.MeshStandardMaterial({
      color: trackColor,
      roughness: 0.9,
      metalness: 0.1
    });

    // Create straight sections
    const straightGeometry = new THREE.BoxGeometry(
      this.config.length,
      0.1,
      this.config.width
    );

    // Top straight - positioned between inner and outer barriers
    const topStraight = new THREE.Mesh(straightGeometry, material);
    topStraight.position.set(0, 0.05, -(this.config.radius + this.config.width / 2));
    topStraight.receiveShadow = true;
    this.group.add(topStraight);

    // Bottom straight - positioned between inner and outer barriers
    const bottomStraight = new THREE.Mesh(straightGeometry, material);
    bottomStraight.position.set(0, 0.05, this.config.radius + this.config.width / 2);
    bottomStraight.receiveShadow = true;
    this.group.add(bottomStraight);

    // Create curved ends using tube geometry
    this.createCurvedSection(material, true);  // Right curve
    this.createCurvedSection(material, false); // Left curve
  }

  private createCurvedSection(material: THREE.Material, isRight: boolean): void {
    const segments = 32;
    const angleStart = isRight ? -Math.PI / 2 : Math.PI / 2;
    const angleEnd = isRight ? Math.PI / 2 : Math.PI * 1.5;

    // Create a shape for the curved section
    const shape = new THREE.Shape();

    // Create outer arc (matches outer barrier position)
    for (let i = 0; i <= segments; i++) {
      const angle = angleStart + (angleEnd - angleStart) * (i / segments);
      const outerRadius = this.config.radius + this.config.width;

      const outerX = Math.cos(angle) * outerRadius;
      const outerZ = Math.sin(angle) * outerRadius;

      if (i === 0) {
        shape.moveTo(outerX, outerZ);
      } else {
        shape.lineTo(outerX, outerZ);
      }
    }

    // Add inner arc (in reverse) - matches inner barrier position
    for (let i = segments; i >= 0; i--) {
      const angle = angleStart + (angleEnd - angleStart) * (i / segments);
      const innerRadius = this.config.radius;

      const innerX = Math.cos(angle) * innerRadius;
      const innerZ = Math.sin(angle) * innerRadius;

      shape.lineTo(innerX, innerZ);
    }

    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.05;
    mesh.position.x = isRight ? this.config.length / 2 : -this.config.length / 2;
    mesh.receiveShadow = true;

    this.group.add(mesh);
  }

  private createBarriers(): void {
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown for posts
      roughness: 0.7,
      metalness: 0.1
    });

    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White for rails
      roughness: 0.6,
      metalness: 0.2
    });

    const postSpacing = 4; // Distance between posts

    // Outer barriers (straight sections)
    this.createStraightBarrierWithPosts(
      postMaterial,
      railMaterial,
      this.config.length,
      -(this.config.radius + this.config.width),
      postSpacing
    );
    this.createStraightBarrierWithPosts(
      postMaterial,
      railMaterial,
      this.config.length,
      this.config.radius + this.config.width,
      postSpacing
    );

    // Inner barriers (straight sections)
    this.createStraightBarrierWithPosts(
      postMaterial,
      railMaterial,
      this.config.length,
      -(this.config.radius),
      postSpacing
    );
    this.createStraightBarrierWithPosts(
      postMaterial,
      railMaterial,
      this.config.length,
      this.config.radius,
      postSpacing
    );

    // Curved barriers
    this.createCurvedBarrierWithPosts(postMaterial, railMaterial, true, true);   // Right outer
    this.createCurvedBarrierWithPosts(postMaterial, railMaterial, true, false);  // Right inner
    this.createCurvedBarrierWithPosts(postMaterial, railMaterial, false, true);  // Left outer
    this.createCurvedBarrierWithPosts(postMaterial, railMaterial, false, false); // Left inner
  }

  private createStraightBarrierWithPosts(
    postMaterial: THREE.Material,
    railMaterial: THREE.Material,
    length: number,
    zPosition: number,
    postSpacing: number
  ): void {
    const postRadius = 0.08;
    const postHeight = this.config.barrierHeight;
    const railRadius = 0.04;
    const numRails = 3;

    // Calculate number of posts needed
    const numPosts = Math.ceil(length / postSpacing) + 1;
    const actualSpacing = length / (numPosts - 1);

    // Create posts
    const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8);
    for (let i = 0; i < numPosts; i++) {
      const x = -length / 2 + i * actualSpacing;
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x, postHeight / 2, zPosition);
      post.castShadow = true;
      post.receiveShadow = true;
      this.group.add(post);
    }

    // Create horizontal rails
    const railLength = length;
    for (let rail = 0; rail < numRails; rail++) {
      const railHeight = postHeight * (rail + 1) / (numRails + 1);
      const railGeometry = new THREE.CylinderGeometry(railRadius, railRadius, railLength, 8);
      const railMesh = new THREE.Mesh(railGeometry, railMaterial);
      railMesh.rotation.z = Math.PI / 2;
      railMesh.position.set(0, railHeight, zPosition);
      railMesh.castShadow = true;
      railMesh.receiveShadow = true;
      this.group.add(railMesh);
    }
  }

  private createCurvedBarrierWithPosts(
    postMaterial: THREE.Material,
    railMaterial: THREE.Material,
    isRight: boolean,
    isOuter: boolean
  ): void {
    const postRadius = 0.08;
    const postHeight = this.config.barrierHeight;
    const railRadius = 0.04;
    const numRails = 3;
    const postSpacing = 4;

    const angleStart = isRight ? -Math.PI / 2 : Math.PI / 2;
    const angleEnd = isRight ? Math.PI / 2 : Math.PI * 1.5;
    const radius = isOuter
      ? this.config.radius + this.config.width
      : this.config.radius;

    // Calculate arc length and number of posts
    const arcLength = Math.abs(angleEnd - angleStart) * radius;
    const numPosts = Math.ceil(arcLength / postSpacing);
    const angleStep = (angleEnd - angleStart) / numPosts;

    // Create posts along the curve
    const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8);
    const postPositions: THREE.Vector3[] = [];

    for (let i = 0; i <= numPosts; i++) {
      const angle = angleStart + angleStep * i;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(
        (isRight ? this.config.length / 2 : -this.config.length / 2) + x,
        postHeight / 2,
        z
      );
      post.castShadow = true;
      post.receiveShadow = true;
      this.group.add(post);

      postPositions.push(new THREE.Vector3(x, 0, z));
    }

    // Create rails along the curve
    const segments = 32;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = angleStart + (angleEnd - angleStart) * (i / segments);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, 0, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    // Create multiple rail levels
    for (let rail = 0; rail < numRails; rail++) {
      const railHeight = postHeight * (rail + 1) / (numRails + 1);
      const tubeGeometry = new THREE.TubeGeometry(
        curve,
        segments,
        railRadius,
        8,
        false
      );

      const railMesh = new THREE.Mesh(tubeGeometry, railMaterial);
      railMesh.position.x = isRight ? this.config.length / 2 : -this.config.length / 2;
      railMesh.position.y = railHeight;
      railMesh.castShadow = true;
      railMesh.receiveShadow = true;

      this.group.add(railMesh);
    }
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getConfig(): RaceTrackConfig {
    return { ...this.config };
  }

  public getStartingPositions(numPositions: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const startZ = this.config.radius + this.config.width / 2; // Start at bottom straight
    const startX = -this.config.length / 2 + 5; // 5 units from the left end
    const spacing = this.config.width / (numPositions + 1);

    for (let i = 0; i < numPositions; i++) {
      const x = startX;
      const z = startZ - this.config.width / 2 + spacing * (i + 1);
      positions.push(new THREE.Vector3(x, 0.5, z));
    }

    return positions;
  }
}
