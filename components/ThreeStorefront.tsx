'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeStorefrontProps {
  onDriveAgain?: () => void;
  isOverlay?: boolean;
  className?: string;
}

export const ThreeStorefront: React.FC<ThreeStorefrontProps> = ({
  onDriveAgain,
  isOverlay = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [nightMode, setNightMode] = useState<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // -------------------------------------------------------------------------
    // 1. THREE.JS SCENE SETUP
    // -------------------------------------------------------------------------
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = null; // transparent background so it blends seamlessly

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 9.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // 2. LIGHTING RIG
    // -------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xfff6f0, nightMode ? 0.7 : 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfffbeb, nightMode ? 0.4 : 2.0);
    mainSun.position.set(8, 14, 10);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 1024;
    mainSun.shadow.mapSize.height = 1024;
    mainSun.shadow.camera.near = 0.5;
    mainSun.shadow.camera.far = 30;
    mainSun.shadow.bias = -0.001;
    const d = 8;
    mainSun.shadow.camera.left = -d;
    mainSun.shadow.camera.right = d;
    mainSun.shadow.camera.top = d;
    mainSun.shadow.camera.bottom = -d;
    scene.add(mainSun);

    // Canopy & Entrance Warm Glow
    const canopySpot = new THREE.PointLight(0xffe500, nightMode ? 4.5 : 2.8, 14);
    canopySpot.position.set(0, 3.4, 1.8);
    canopySpot.castShadow = true;
    scene.add(canopySpot);

    // Interior Ambient Showroom Light
    const interiorSpot = new THREE.PointLight(0x60a5fa, nightMode ? 3.5 : 2.0, 10);
    interiorSpot.position.set(0, 2.2, -0.5);
    scene.add(interiorSpot);

    // Storefront Group
    const storeGroup = new THREE.Group();
    scene.add(storeGroup);

    // -------------------------------------------------------------------------
    // 3. MATERIALS
    // -------------------------------------------------------------------------
    const brandBlue = 0x02529c;
    const brandYellow = 0xffe500;
    const darkSteel = 0x1e293b;

    const facadeMat = new THREE.MeshStandardMaterial({
      color: brandBlue,
      roughness: 0.25,
      metalness: 0.4,
    });

    const trimYellowMat = new THREE.MeshStandardMaterial({
      color: brandYellow,
      roughness: 0.15,
      metalness: 0.6,
      emissive: 0xffd000,
      emissiveIntensity: nightMode ? 0.6 : 0.25,
    });

    const darkPillarMat = new THREE.MeshStandardMaterial({
      color: darkSteel,
      roughness: 0.3,
      metalness: 0.8,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      transmission: 0.85,
      thickness: 0.5,
      reflectivity: 0.9,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.3,
      metalness: 0.2,
    });

    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0xd6c7be,
      roughness: 0.8,
      metalness: 0.1,
    });

    // -------------------------------------------------------------------------
    // 4. ARCHITECTURAL 3D MESHES
    // -------------------------------------------------------------------------

    // A. Ground Plaza & Sidewalk
    const plazaGeo = new THREE.BoxGeometry(14, 0.4, 10);
    const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
    plazaMesh.position.set(0, -0.2, 1);
    plazaMesh.receiveShadow = true;
    storeGroup.add(plazaMesh);

    // Entrance Steps
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.15, 1.8), floorMat);
    step1.position.set(0, 0.075, 2.8);
    step1.receiveShadow = true;
    storeGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.15, 1.4), floorMat);
    step2.position.set(0, 0.225, 2.5);
    step2.receiveShadow = true;
    storeGroup.add(step2);

    // B. Main Building Shell
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.6, 4.4, 0.3), facadeMat);
    backWall.position.set(0, 2.2, -2.6);
    backWall.receiveShadow = true;
    storeGroup.add(backWall);

    // Side Walls
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.4, 4.8), facadeMat);
    leftWall.position.set(-4.8, 2.2, -0.2);
    leftWall.receiveShadow = true;
    storeGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.4, 4.8), facadeMat);
    rightWall.position.set(4.8, 2.2, -0.2);
    rightWall.receiveShadow = true;
    storeGroup.add(rightWall);

    // Interior Store Floor
    const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.1, 4.8), floorMat);
    interiorFloor.position.set(0, 0.35, -0.2);
    interiorFloor.receiveShadow = true;
    storeGroup.add(interiorFloor);

    // Interior Ceiling
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.2, 4.8), darkPillarMat);
    ceiling.position.set(0, 4.3, -0.2);
    storeGroup.add(ceiling);

    // C. Structural Columns
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 0.5), darkPillarMat);
    p1.position.set(-4.6, 2.2, 2.0);
    p1.castShadow = true;
    storeGroup.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 0.5), darkPillarMat);
    p2.position.set(4.6, 2.2, 2.0);
    p2.castShadow = true;
    storeGroup.add(p2);

    const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.4, 0.4), darkPillarMat);
    p3.position.set(-1.8, 2.2, 2.0);
    p3.castShadow = true;
    storeGroup.add(p3);

    const p4 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.4, 0.4), darkPillarMat);
    p4.position.set(1.8, 2.2, 2.0);
    p4.castShadow = true;
    storeGroup.add(p4);

    // D. Front Glass Windows & Automatic Sliding Doors
    // Left display window
    const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 0.08), glassMat);
    leftGlass.position.set(-3.2, 1.9, 2.0);
    storeGroup.add(leftGlass);

    // Right display window
    const rightGlass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 0.08), glassMat);
    rightGlass.position.set(3.2, 1.9, 2.0);
    storeGroup.add(rightGlass);

    // Center Entrance Glass Door (Slid slightly open to be inviting)
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 0.06), glassMat);
    doorL.position.set(-0.95, 1.9, 2.0);
    storeGroup.add(doorL);

    const doorR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 0.06), glassMat);
    doorR.position.set(0.95, 1.9, 1.96);
    storeGroup.add(doorR);

    // Door handles
    const handleMat = new THREE.MeshStandardMaterial({ color: brandYellow, metalness: 0.9, roughness: 0.2 });
    const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), handleMat);
    handleL.position.set(-0.35, 1.8, 2.08);
    storeGroup.add(handleL);

    const handleR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), handleMat);
    handleR.position.set(0.35, 1.8, 2.08);
    storeGroup.add(handleR);

    // E. Modern Overhanging Cantilever Canopy
    const canopyGeo = new THREE.BoxGeometry(10.6, 0.35, 2.6);
    const canopy = new THREE.Mesh(canopyGeo, facadeMat);
    canopy.position.set(0, 3.9, 2.8);
    canopy.castShadow = true;
    storeGroup.add(canopy);

    // Golden Neon Edge Trim on Canopy
    const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(10.65, 0.06, 0.06), trimYellowMat);
    canopyTrim.position.set(0, 3.75, 4.08);
    storeGroup.add(canopyTrim);

    // F. Storefront Signage / Marquee
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.1, 0.2), facadeMat);
    signBoard.position.set(0, 4.6, 2.2);
    signBoard.castShadow = true;
    storeGroup.add(signBoard);

    const signBoardBorder = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.05, 0.22), trimYellowMat);
    signBoardBorder.position.set(0, 4.05, 2.2);
    storeGroup.add(signBoardBorder);

    // Stylized 3D Flipkart Bag Emblem
    const bagMat = new THREE.MeshStandardMaterial({
      color: brandYellow,
      metalness: 0.5,
      roughness: 0.2,
      emissive: 0xffe500,
      emissiveIntensity: 0.35,
    });
    const bagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.15), bagMat);
    bagMesh.position.set(-2.4, 4.6, 2.32);
    storeGroup.add(bagMesh);

    // Bag Handle
    const bagHandleMat = new THREE.MeshStandardMaterial({ color: 0x024e9d, metalness: 0.8 });
    const bagHandle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 24, Math.PI), bagHandleMat);
    bagHandle.position.set(-2.4, 4.95, 2.32);
    storeGroup.add(bagHandle);

    // 3D Illuminated Lettering on Signboard
    // Canvas texture for crisp brand typography
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const signCtx = signCanvas.getContext('2d');
    if (signCtx) {
      signCtx.fillStyle = '#024E9D';
      signCtx.fillRect(0, 0, 1024, 256);

      // Gold accent bar
      signCtx.fillStyle = '#FFE500';
      signCtx.fillRect(40, 220, 944, 12);

      // Main Brand Name
      signCtx.fillStyle = '#FFFFFF';
      signCtx.font = '900 84px system-ui, -apple-system, sans-serif';
      signCtx.textAlign = 'left';
      signCtx.textBaseline = 'middle';
      signCtx.fillText('Flipkart', 220, 100);

      // Tagline
      signCtx.fillStyle = '#FFE500';
      signCtx.font = '700 36px system-ui, -apple-system, sans-serif';
      signCtx.fillText('FLAGSHIP 3D STORE', 220, 168);
    }
    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
    const signScreen = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.0), signMat);
    signScreen.position.set(0.6, 4.6, 2.31);
    storeGroup.add(signScreen);

    // -------------------------------------------------------------------------
    // 5. INTERIOR SHOWCASE PEDESTALS & 3D PRODUCTS
    // -------------------------------------------------------------------------
    const interactableObjects: THREE.Object3D[] = [];

    // Pedestal Base Material
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.3,
    });
    const pedRingCyan = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
    });
    const pedRingGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
    });

    // === PRODUCT 1: FLAGSHIP SMARTPHONE (Left Window) ===
    const ped1Group = new THREE.Group();
    ped1Group.position.set(-3.2, 0.4, 0.6);
    storeGroup.add(ped1Group);

    const ped1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 1.0, 32), pedMat);
    ped1.position.y = 0.5;
    ped1.receiveShadow = true;
    ped1Group.add(ped1);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 8, 32), pedRingCyan);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 1.0;
    ped1Group.add(ring1);

    // 3D Phone
    const phoneGroup = new THREE.Group();
    phoneGroup.position.y = 1.45;
    ped1Group.add(phoneGroup);
    (phoneGroup as unknown as { productName: string }).productName = 'Pro Series Smartphone';
    interactableObjects.push(phoneGroup);

    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.72, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
    );
    phoneBody.castShadow = true;
    phoneGroup.add(phoneBody);

    // Glowing screen
    const phoneScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.66),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    phoneScreen.position.z = 0.026;
    phoneGroup.add(phoneScreen);

    // Camera lenses
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16), lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(-0.08, 0.24 - i * 0.08, -0.028);
      phoneGroup.add(lens);
    }

    // === PRODUCT 2: FLIPKART SPECIAL DELIVERY VAULT & PACKAGES (Center) ===
    const ped2Group = new THREE.Group();
    ped2Group.position.set(0, 0.4, -0.6);
    storeGroup.add(ped2Group);

    const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.9, 6), pedMat);
    ped2.position.y = 0.45;
    ped2.receiveShadow = true;
    ped2Group.add(ped2);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.035, 8, 6), pedRingGold);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.9;
    ped2Group.add(ring2);

    // Delivery Box Group
    const boxGroup = new THREE.Group();
    boxGroup.position.y = 1.35;
    ped2Group.add(boxGroup);
    (boxGroup as unknown as { productName: string }).productName = 'Flipkart Smart Delivery Packages';
    interactableObjects.push(boxGroup);

    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0xffe500, roughness: 0.3 });

    // Main Box
    const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.55), boxMat);
    box1.castShadow = true;
    boxGroup.add(box1);

    const tape1 = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.56), tapeMat);
    boxGroup.add(tape1);

    // Second stacked box (tilted)
    const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.38), boxMat);
    box2.position.set(0.08, 0.4, 0.04);
    box2.rotation.y = 0.25;
    box2.castShadow = true;
    boxGroup.add(box2);

    const tape2 = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.06, 0.39), tapeMat);
    tape2.position.set(0.08, 0.4, 0.04);
    tape2.rotation.y = 0.25;
    boxGroup.add(tape2);

    // === PRODUCT 3: HIGH-FIDELITY HEADPHONES (Right Window) ===
    const ped3Group = new THREE.Group();
    ped3Group.position.set(3.2, 0.4, 0.6);
    storeGroup.add(ped3Group);

    const ped3 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 1.0, 32), pedMat);
    ped3.position.y = 0.5;
    ped3.receiveShadow = true;
    ped3Group.add(ped3);

    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 8, 32), pedRingGold);
    ring3.rotation.x = Math.PI / 2;
    ring3.position.y = 1.0;
    ped3Group.add(ring3);

    // 3D Headphones
    const headphoneGroup = new THREE.Group();
    headphoneGroup.position.y = 1.45;
    ped3Group.add(headphoneGroup);
    (headphoneGroup as unknown as { productName: string }).productName = 'Audiophile Wireless Headphones';
    interactableObjects.push(headphoneGroup);

    const hpMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.3 });
    const goldRingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });

    // Headband
    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 16, 32, Math.PI), hpMat);
    headband.rotation.z = Math.PI;
    headband.position.y = 0.25;
    headphoneGroup.add(headband);

    // Earcups
    const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), hpMat);
    cupL.rotation.z = Math.PI / 2;
    cupL.position.set(-0.3, 0.24, 0);
    headphoneGroup.add(cupL);

    const cupR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), hpMat);
    cupR.rotation.z = Math.PI / 2;
    cupR.position.set(0.3, 0.24, 0);
    headphoneGroup.add(cupR);

    const accentL = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.012, 8, 24), goldRingMat);
    accentL.rotation.y = Math.PI / 2;
    accentL.position.set(-0.34, 0.24, 0);
    headphoneGroup.add(accentL);

    const accentR = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.012, 8, 24), goldRingMat);
    accentR.rotation.y = Math.PI / 2;
    accentR.position.set(0.34, 0.24, 0);
    headphoneGroup.add(accentR);

    // -------------------------------------------------------------------------
    // 6. FLOATING CELEBRATION AMBIENT PARTICLES
    // -------------------------------------------------------------------------
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = 0.5 + Math.random() * 4.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8 + 1;
      particleSpeeds.push(0.005 + Math.random() * 0.01);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // -------------------------------------------------------------------------
    // 7. ORBIT / ROTATION INTERACTION CONTROLS
    // -------------------------------------------------------------------------
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let targetRotationY = 0.08;
    let targetRotationX = 0.05;
    let autoRotate = true;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      autoRotate = false;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;

      targetRotationY += deltaX * 0.006;
      targetRotationX = Math.max(-0.2, Math.min(0.35, targetRotationX + deltaY * 0.004));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Raycaster for clicking on products
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects(storeGroup.children, true);

      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && curr !== storeGroup) {
          if ((curr as unknown as { productName?: string }).productName) {
            setSelectedProduct((curr as unknown as { productName: string }).productName);
            return;
          }
          curr = curr.parent;
        }
      }
    };
    domElement.addEventListener('click', onClick);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------------------
    // 8. ANIMATION LOOP
    // -------------------------------------------------------------------------
    let animId: number;
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // Idle auto-rotation
      if (autoRotate) {
        targetRotationY = Math.sin(elapsed * 0.35) * 0.18;
        targetRotationX = 0.06 + Math.cos(elapsed * 0.25) * 0.04;
      }

      // Smooth inertia damping
      storeGroup.rotation.y += (targetRotationY - storeGroup.rotation.y) * 0.08;
      storeGroup.rotation.x += (targetRotationX - storeGroup.rotation.x) * 0.08;

      // Product Rotations & Hover Bobbing
      phoneGroup.rotation.y += 0.8 * delta;
      phoneGroup.position.y = 1.45 + Math.sin(elapsed * 2.2) * 0.04;

      boxGroup.rotation.y += 0.5 * delta;
      boxGroup.position.y = 1.35 + Math.sin(elapsed * 1.8 + 1) * 0.03;

      headphoneGroup.rotation.y += 0.7 * delta;
      headphoneGroup.position.y = 1.45 + Math.sin(elapsed * 2.0 + 2) * 0.04;

      // Canopy Light pulse
      canopySpot.intensity = (nightMode ? 4.5 : 2.8) + Math.sin(elapsed * 3) * 0.4;

      // Particle Floating
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 1] += particleSpeeds[i];
        if (arr[i * 3 + 1] > 5.2) {
          arr[i * 3 + 1] = 0.5;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }

      renderer.dispose();
      plazaGeo.dispose();
      particleGeo.dispose();
    };
  }, [nightMode]);

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[380px] sm:min-h-[460px] cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden"
      />

      {/* Floating 3D Storefront Header & Controls */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 shadow-xl pointer-events-auto">
          <div className="w-6 h-6 rounded bg-[#FFE500] text-[#024E9D] font-black text-xs flex items-center justify-center shadow">
            f
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Flipkart 3D Store</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[10px] text-slate-300">Drag to orbit in 3D • Tap items to inspect</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Day / Night Neon toggle */}
          <button
            onClick={() => setNightMode((prev) => !prev)}
            className="bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-white text-xs font-medium px-3 py-2 rounded-full border border-white/15 shadow-xl transition-all flex items-center gap-1.5"
            title="Toggle Day/Night Lighting"
          >
            <span>{nightMode ? '☀️ Day View' : '🌙 Neon View'}</span>
          </button>

          {/* Drive Again / Replay Button */}
          {onDriveAgain && (
            <button
              onClick={onDriveAgain}
              className="bg-[#FFE500] hover:bg-yellow-300 text-[#024E9D] font-black text-xs px-4 py-2 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>↺ Drive Again</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Product Toast / Card */}
      {selectedProduct && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-[#FFE500]/50 text-white px-5 py-2.5 rounded-xl shadow-2xl z-20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFE500]" />
          <div>
            <div className="text-[11px] font-semibold text-yellow-300 uppercase tracking-wider">Showcase Product</div>
            <div className="text-sm font-bold text-white">{selectedProduct}</div>
          </div>
          <button
            onClick={() => setSelectedProduct(null)}
            className="text-white/60 hover:text-white text-xs ml-2 p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
