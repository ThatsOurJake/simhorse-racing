import * as THREE from "three";
import { FONT } from "./constants";
import type { HorseData } from "./horseStats";
import { type BigScreenSystem, createBigScreen } from "./models/bigScreen";
import { loadBleachers } from "./models/bleachers";
import { createDistantHills } from "./models/distantHills";
import { createBannerFabric, type RacingBanner } from "./models/racerBanners";
import { getCurrentTheme, getThemeConfig, type ThemeType } from "./themeConfig";

export interface RaceTrackConfig {
  length: number; // Length of straight sections
  width: number; // Width of the racing surface
  radius: number; // Radius of the curved ends
  barrierHeight: number; // Height of barriers
  barrierThickness: number; // Thickness of barrier walls
}

export class RaceTrack {
  private group: THREE.Group;
  private config: RaceTrackConfig;
  private ground: THREE.Mesh | null = null;
  private currentTheme: ThemeType;
  private horses: HorseData[] = [];
  private bigScreen: BigScreenSystem | null = null;

  constructor(config?: Partial<RaceTrackConfig>) {
    this.config = {
      length: 40,
      width: 12,
      radius: 15,
      barrierHeight: 2,
      barrierThickness: 0.3,
      ...config,
    };

    this.currentTheme = getCurrentTheme();
    this.group = new THREE.Group();
    this.createTrack();
    this.createBarriers();
    this.createFinishLine();
    this.createFinalStretchBanner();
    this.createFinishBanner();
    createDistantHills(this.group, this.config, this.currentTheme);
    loadBleachers(this.group, this.config);
  }

  public initializeBigScreen(placeholderTexture: THREE.Texture): void {
    // Create big screen system
    this.bigScreen = createBigScreen(this.config, placeholderTexture);
    this.group.add(this.bigScreen.group);
  }

  private createFinishLine(): void {
    // Create checkered finish line at the starting position with 3 rows
    // Calculate number of squares based on track width (approximately 1.5 units per square)
    const numSquares = Math.max(8, Math.ceil(this.config.width / 1.5));
    const squareWidth = this.config.width / numSquares;
    const lineThickness = 0.5;
    const numRows = 3;

    for (let row = 0; row < numRows; row++) {
      // Offset for each row: -1, 0, 1 (behind, center, front)
      const rowOffset = (row - 1) * lineThickness;

      for (let i = 0; i < numSquares; i++) {
        // Alternate black and white squares, offset pattern by row for classic checkered look
        const color = (i + row) % 2 === 0 ? 0x000000 : 0xffffff;
        const material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.8,
          metalness: 0.2,
        });

        const squareGeometry = new THREE.BoxGeometry(
          lineThickness,
          0.11, // Slightly taller than track to be visible
          squareWidth,
        );

        const square = new THREE.Mesh(squareGeometry, material);
        // Position at the start of the track
        square.position.x = -this.config.length / 2 + rowOffset;
        square.position.y = 0.05;
        square.position.z =
          this.config.radius + squareWidth * i + squareWidth / 2;
        square.receiveShadow = true;
        square.castShadow = true;

        this.group.add(square);
      }
    }
  }

  private createFinalStretchBanner(): void {
    // Position banner on the left curve (second curve) at approximately the midpoint
    // The left curve is the 4th section of the track, connecting top straight back to start
    const bannerHeight = 4;
    const curveRadius = this.config.radius + this.config.width / 2;

    // Position at angle -π (180 degrees) - middle of left curve
    const angle = -Math.PI;
    const bannerX = -this.config.length / 2 + Math.cos(angle) * curveRadius;
    const bannerZ = Math.sin(angle) * curveRadius;

    // Calculate width to span across the track (perpendicular to curve)
    const bannerWidth = this.config.width + 4;

    // Posts positioned on inner and outer edges
    const postGeometry = new THREE.CylinderGeometry(
      0.15,
      0.15,
      bannerHeight,
      8,
    );
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      metalness: 0.3,
      roughness: 0.7,
    });

    // Inner post
    const innerRadius = this.config.radius - 2;
    const innerPost = new THREE.Mesh(postGeometry, postMaterial);
    innerPost.position.set(
      -this.config.length / 2 + Math.cos(angle) * innerRadius,
      bannerHeight / 2,
      Math.sin(angle) * innerRadius,
    );
    innerPost.castShadow = true;
    this.group.add(innerPost);

    // Outer post
    const outerRadius = this.config.radius + this.config.width + 2;
    const outerPost = new THREE.Mesh(postGeometry, postMaterial);
    outerPost.position.set(
      -this.config.length / 2 + Math.cos(angle) * outerRadius,
      bannerHeight / 2,
      Math.sin(angle) * outerRadius,
    );
    outerPost.castShadow = true;
    this.group.add(outerPost);

    // Banner board (oriented radially across the curve)
    const bannerGeometry = new THREE.BoxGeometry(0.2, 1, bannerWidth);
    const bannerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      metalness: 0.2,
      roughness: 0.6,
    });
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.set(bannerX, bannerHeight, bannerZ);
    banner.rotation.y = angle + Math.PI / 2; // Perpendicular to the curve radius
    banner.castShadow = true;
    this.group.add(banner);
  }

  private createFinishBanner(): void {
    // Create overhead banner at finish line
    const bannerHeight = 4;
    const bannerWidth = this.config.width + 4;

    // Left post
    const postGeometry = new THREE.CylinderGeometry(
      0.15,
      0.15,
      bannerHeight,
      8,
    );
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.7,
    });

    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(
      -this.config.length / 2,
      bannerHeight / 2,
      this.config.radius - 2,
    );
    leftPost.castShadow = true;
    leftPost.layers.set(1); // Set to layer 1 only (hidden from finish line camera)
    this.group.add(leftPost);

    // Right post
    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(
      -this.config.length / 2,
      bannerHeight / 2,
      this.config.radius + this.config.width + 2,
    );
    rightPost.castShadow = true;
    rightPost.layers.set(1); // Set to layer 1 only (hidden from finish line camera)
    this.group.add(rightPost);

    // Banner board
    const bannerGeometry = new THREE.BoxGeometry(0.2, 1, bannerWidth);
    const bannerMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.2,
      roughness: 0.6,
    });
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.set(
      -this.config.length / 2,
      bannerHeight,
      this.config.radius + this.config.width / 2,
    );
    banner.castShadow = true;
    banner.layers.set(1); // Set to layer 1 only (hidden from finish line camera)
    this.group.add(banner);

    // Banner text
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#ff0000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.font = `bold 72px ${FONT}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("FINISH", canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const textGeometry = new THREE.PlaneGeometry(bannerWidth - 0.5, 0.9);

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(
      -this.config.length / 2 - 0.11,
      bannerHeight,
      this.config.radius + this.config.width / 2,
    );
    textMesh.rotation.y = Math.PI / 2;
    textMesh.layers.set(1); // Set to layer 1 only (hidden from finish line camera)
    this.group.add(textMesh);
  }

  private createTrack(): void {
    const trackColor = 0xc19a6b; // Sandy brown color
    const material = new THREE.MeshStandardMaterial({
      color: trackColor,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Create straight sections with slight overlap to avoid seams
    const overlap = 0.2; // Small overlap to eliminate seams
    const straightGeometry = new THREE.BoxGeometry(
      this.config.length + overlap,
      0.1,
      this.config.width,
    );

    // Top straight - positioned between inner and outer barriers
    const topStraight = new THREE.Mesh(straightGeometry, material);
    topStraight.position.set(
      0,
      0,
      -(this.config.radius + this.config.width / 2),
    );
    topStraight.receiveShadow = true;
    this.group.add(topStraight);

    // Bottom straight - positioned between inner and outer barriers
    const bottomStraight = new THREE.Mesh(straightGeometry, material);
    bottomStraight.position.set(
      0,
      0,
      this.config.radius + this.config.width / 2,
    );
    bottomStraight.receiveShadow = true;
    this.group.add(bottomStraight);

    // Create curved ends using tube geometry
    this.createCurvedSection(material, true); // Right curve
    this.createCurvedSection(material, false); // Left curve
  }

  private createCurvedSection(
    material: THREE.Material,
    isRight: boolean,
  ): void {
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
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0; // Position at ground level, same as straight sections
    mesh.position.x = isRight
      ? this.config.length / 2
      : -this.config.length / 2;
    mesh.receiveShadow = true;

    this.group.add(mesh);
  }

  private createBarriers(): void {
    const themeConfig = getThemeConfig(this.currentTheme);
    const isCandyCane = themeConfig.fenceType === "candy-cane";

    const postMaterial = new THREE.MeshStandardMaterial({
      color: isCandyCane ? 0xffffff : 0x8b4513, // White for candy canes, brown for posts
      roughness: 0.7,
      metalness: 0.1,
    });

    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White for rails
      roughness: 0.6,
      metalness: 0.2,
    });

    const postSpacing = 4; // Distance between posts

    // Outer barriers (straight sections)
    this.createStraightBarrierWithPosts(
      postMaterial,
      railMaterial,
      this.config.length,
      -(this.config.radius + this.config.width),
      postSpacing,
      isCandyCane,
    );
    this.createStraightBarrierWithPosts(
      postMaterial,
      railMaterial,
      this.config.length,
      this.config.radius + this.config.width,
      postSpacing,
      isCandyCane,
    );

    // Inner barriers (straight sections)
    this.createStraightBarrierWithPosts(
      postMaterial,
      railMaterial,
      this.config.length,
      -this.config.radius,
      postSpacing,
      isCandyCane,
    );
    this.createStraightBarrierWithPosts(
      postMaterial,
      railMaterial,
      this.config.length,
      this.config.radius,
      postSpacing,
      isCandyCane,
    );

    // Curved barriers
    this.createCurvedBarrierWithPosts(
      postMaterial,
      railMaterial,
      true,
      true,
      isCandyCane,
    ); // Right outer
    this.createCurvedBarrierWithPosts(
      postMaterial,
      railMaterial,
      true,
      false,
      isCandyCane,
    ); // Right inner
    this.createCurvedBarrierWithPosts(
      postMaterial,
      railMaterial,
      false,
      true,
      isCandyCane,
    ); // Left outer
    this.createCurvedBarrierWithPosts(
      postMaterial,
      railMaterial,
      false,
      false,
      isCandyCane,
    ); // Left inner
  }

  private createStraightBarrierWithPosts(
    postMaterial: THREE.Material,
    railMaterial: THREE.Material,
    length: number,
    zPosition: number,
    postSpacing: number,
    isCandyCane: boolean,
  ): void {
    const postRadius = 0.08;
    const postHeight = this.config.barrierHeight;
    const railRadius = 0.04;
    const numRails = 3;

    // Calculate number of posts needed
    const numPosts = Math.ceil(length / postSpacing) + 1;
    const actualSpacing = length / (numPosts - 1);

    // Create posts
    for (let i = 0; i < numPosts; i++) {
      const x = -length / 2 + i * actualSpacing;
      const post = isCandyCane
        ? this.createCandyCanePost(postHeight)
        : new THREE.Mesh(
            new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8),
            postMaterial,
          );
      post.position.set(x, postHeight / 2, zPosition);
      post.castShadow = true;
      post.receiveShadow = true;
      this.group.add(post);
    }

    // Create horizontal rails
    const railLength = length;
    for (let rail = 0; rail < numRails; rail++) {
      const railHeight = (postHeight * (rail + 1)) / (numRails + 1);
      const railGeometry = new THREE.CylinderGeometry(
        railRadius,
        railRadius,
        railLength,
        8,
      );
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
    isOuter: boolean,
    isCandyCane: boolean,
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
    const postPositions: THREE.Vector3[] = [];

    for (let i = 0; i <= numPosts; i++) {
      const angle = angleStart + angleStep * i;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const post = isCandyCane
        ? this.createCandyCanePost(postHeight)
        : new THREE.Mesh(
            new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8),
            postMaterial,
          );
      post.position.set(
        (isRight ? this.config.length / 2 : -this.config.length / 2) + x,
        postHeight / 2,
        z,
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
      const railHeight = (postHeight * (rail + 1)) / (numRails + 1);
      const tubeGeometry = new THREE.TubeGeometry(
        curve,
        segments,
        railRadius,
        8,
        false,
      );

      const railMesh = new THREE.Mesh(tubeGeometry, railMaterial);
      railMesh.position.x = isRight
        ? this.config.length / 2
        : -this.config.length / 2;
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

  public getBigScreen(): BigScreenSystem | null {
    return this.bigScreen;
  }

  public setRacers(horses: HorseData[]): void {
    this.horses = horses;
    // Remove any existing racer banners
    this.group.children = this.group.children.filter(
      (child) => !(child as RacingBanner).isRacerBanner,
    );
    // Create new banners
    this.createRacerBanners();
  }

  public getStartingPositions(numPositions: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const laneSpacing = this.config.width / (numPositions + 1);

    for (let i = 0; i < numPositions; i++) {
      // Calculate lane offset for this horse
      const laneOffset = laneSpacing * (i + 1);

      // Use getTrackPosition at progress 0 to align with race start
      const trackPos = this.getTrackPosition(0, laneOffset);
      trackPos.y = 0.5; // Horse height above ground

      positions.push(trackPos);
    }

    return positions;
  }

  /**
   * Get a position on the track based on progress distance traveled.
   * Progress 0 starts at the starting line, increases as you go around the track.
   * @param progress - Distance traveled around track
   * @param laneOffset - Offset from inner edge (0 = inner barrier, this.config.width = outer barrier)
   * @returns Position on the track
   */
  public getTrackPosition(
    progress: number,
    laneOffset: number = this.config.width / 2,
  ): THREE.Vector3 {
    const totalLength =
      this.config.length * 2 + Math.PI * this.config.radius * 2;

    // Handle progress beyond track length (for deceleration after finish)
    if (progress > totalLength) {
      // Continue straight past the finish line in +X direction
      const extraDistance = progress - totalLength;
      const zFromInner = this.config.radius + laneOffset;
      const x = -this.config.length / 2 + extraDistance;
      return new THREE.Vector3(x, 0, zFromInner);
    }

    const normalizedProgress = (progress % totalLength) / totalLength;

    const straightLength = this.config.length;
    const curveLength = Math.PI * this.config.radius;

    const section1 = straightLength / totalLength; // Bottom straight
    const section2 = (straightLength + curveLength) / totalLength; // Right curve
    const section3 = (straightLength * 2 + curveLength) / totalLength; // Top straight
    // Remaining is left curve

    // Calculate Z offset from inner edge
    const zFromInner = this.config.radius + laneOffset;

    if (normalizedProgress < section1) {
      // Bottom straight - moving right (+X direction)
      const t = normalizedProgress / section1;
      const x = -this.config.length / 2 + straightLength * t;
      return new THREE.Vector3(x, 0, zFromInner);
    } else if (normalizedProgress < section2) {
      // Right curve - connects bottom straight to top straight
      const t = (normalizedProgress - section1) / (section2 - section1);
      const angle = Math.PI / 2 - Math.PI * t; // Start at +π/2 (bottom), end at -π/2 (top)
      // Use lane-specific radius
      const laneRadius = this.config.radius + laneOffset;
      const x = Math.cos(angle) * laneRadius + this.config.length / 2;
      const z = Math.sin(angle) * laneRadius;
      return new THREE.Vector3(x, 0, z);
    } else if (normalizedProgress < section3) {
      // Top straight - moving left (-X direction)
      const t = (normalizedProgress - section2) / (section3 - section2);
      const x = this.config.length / 2 - straightLength * t;
      return new THREE.Vector3(x, 0, -zFromInner);
    } else {
      // Left curve - connects top straight to bottom straight
      const t = (normalizedProgress - section3) / (1 - section3);
      const angle = -Math.PI / 2 - Math.PI * t; // Start at -π/2 (top), end at -3π/2 (bottom)
      // Use lane-specific radius
      const laneRadius = this.config.radius + laneOffset;
      const x = Math.cos(angle) * laneRadius - this.config.length / 2;
      const z = Math.sin(angle) * laneRadius;
      return new THREE.Vector3(x, 0, z);
    }
  }

  private createRacerBanners(): void {
    if (this.horses.length === 0) return;

    const themeConfig = getThemeConfig(this.currentTheme);
    const numBanners = this.horses.length;
    const bannerSpacing = 8; // Space between banners
    const totalWidth = (numBanners - 1) * bannerSpacing;
    const startX = -totalWidth / 2; // Center the group

    const poleHeight = 5;
    const bannerWidth = 1.5;
    const bannerHeight = 2.5;

    for (let i = 0; i < numBanners; i++) {
      const horse = this.horses[i];
      const x = startX + i * bannerSpacing;
      const z = this.config.radius - 2; // Inner edge of bottom straight (inside the track)

      // Create pole (matches fence theme)
      const pole =
        themeConfig.fenceType === "candy-cane"
          ? this.createCandyCanePost(poleHeight)
          : new THREE.Mesh(
              new THREE.CylinderGeometry(0.08, 0.08, poleHeight, 8),
              new THREE.MeshStandardMaterial({
                color: 0x8b4513,
                roughness: 0.7,
              }),
            );
      pole.position.set(x, poleHeight / 2, z);
      pole.castShadow = true;
      // biome-ignore lint/suspicious/noExplicitAny: Its easier to ignore, than create a new class
      (pole as any).isRacerBanner = true;
      this.group.add(pole);

      // Create finial (same color as racer)
      const finial = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshStandardMaterial({
          color: horse.color,
          metalness: 0.3,
          roughness: 0.6,
        }),
      );
      finial.position.set(x, poleHeight, z);
      finial.castShadow = true;
      // biome-ignore lint/suspicious/noExplicitAny: Its easier to ignore, than create a new class
      (finial as any).isRacerBanner = true;
      this.group.add(finial);

      // Create banner fabric (medieval pointed style)
      createBannerFabric(
        x,
        poleHeight - 0.5,
        z,
        bannerWidth,
        bannerHeight,
        horse,
        this.group,
      );
    }
  }

  private createCandyCanePost(height: number): THREE.Group {
    const group = new THREE.Group();
    const radius = 0.08;
    const stripeHeight = 0.3;
    const numStripes = Math.ceil(height / stripeHeight);

    for (let i = 0; i < numStripes; i++) {
      const isRed = i % 2 === 0;
      const color = isRed ? 0xff0000 : 0xffffff;
      const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        stripeHeight,
        8,
      );
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.1,
      });
      const stripe = new THREE.Mesh(geometry, material);
      stripe.position.y =
        (i - numStripes / 2) * stripeHeight + stripeHeight / 2;
      stripe.castShadow = true;
      stripe.receiveShadow = true;
      group.add(stripe);
    }

    return group;
  }

  public setGround(ground: THREE.Mesh): void {
    this.ground = ground;
    this.updateGroundTexture();
  }

  private updateGroundTexture(): void {
    if (!this.ground) return;
    const themeConfig = getThemeConfig(this.currentTheme);

    // Update ground color
    (this.ground.material as THREE.MeshStandardMaterial).color.setHex(
      themeConfig.groundColor,
    );

    // Add texture pattern if needed
    if (themeConfig.groundTexture === "snow") {
      // Could add snow texture here if desired
    }
  }

  public updateTheme(newTheme: ThemeType): void {
    this.currentTheme = newTheme;

    // Store placeholder texture if big screen exists
    const placeholderTexture = this.bigScreen?.screenMaterial.map;

    // Clear and recreate all track elements with new theme
    this.group.clear();
    this.createTrack();
    this.createBarriers();
    this.createFinishLine();
    this.createFinalStretchBanner();
    this.createFinishBanner();
    createDistantHills(this.group, this.config, this.currentTheme);
    loadBleachers(this.group, this.config);
    this.createRacerBanners(); // Recreate racer banners with new theme

    // Recreate big screen if it existed
    if (placeholderTexture) {
      this.initializeBigScreen(placeholderTexture);
    }

    this.updateGroundTexture();
  }
}
