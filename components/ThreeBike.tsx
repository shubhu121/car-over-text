'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBikeProps {
  wheelRot: number;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * High-performance 3D Road Bike & Articulated Cyclist (Cycle B) built with Three.js.
 * 
 * Features:
 * - Proportional road bike geometry (compact aero wheelbase)
 * - Deep-section carbon rims, disc brake rotors, bladed spokes
 * - Articulated cyclist with 2-link Inverse Kinematics (IK)
 * - Athletic muscle legs, white pro aero socks, and dark bib shorts
 *   for unmistakable, high-contrast pedaling leg motion visibility
 * - Dynamic spinning chainring, crankset, and amber-accented pedals
 * - Studio lighting rig with directional key, soft ambient, and rim lights
 */
export const ThreeBike: React.FC<ThreeBikeProps> = ({
  wheelRot,
  width = 130,
  height = 100,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const rotRef = useRef<number>(wheelRot);
  rotRef.current = wheelRot;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Fully transparent

    // Camera with subtle 8° isometric tilt for optimal 3D depth perception
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 50);
    camera.position.set(0.12, 0.08, 2.75);
    camera.lookAt(0.02, -0.04, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2.5, 4.5, 3.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.0);
    fillLight.position.set(-2.5, 2.5, -2);
    scene.add(fillLight);

    const groundBounceLight = new THREE.DirectionalLight(0xffedd5, 0.7);
    groundBounceLight.position.set(0, -3.5, 2);
    scene.add(groundBounceLight);

    // 3. Materials
    const darkCarbonMat = new THREE.MeshStandardMaterial({
      color: 0x161719,
      roughness: 0.35,
      metalness: 0.65,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x202226,
      roughness: 0.38,
      metalness: 0.55,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.9,
      metalness: 0.1,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.9,
    });
    const alloyMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.75,
    });
    // Athletic warm skin tone with rich specular highlight
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe5a672,
      roughness: 0.52,
      metalness: 0.08,
    });
    const farSkinMat = new THREE.MeshStandardMaterial({
      color: 0xba7c48, // Shadowed depth tone for far leg
      roughness: 0.6,
      metalness: 0.05,
    });
    // High-contrast pro white socks & jersey stripe
    const whiteProMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.1,
    });
    // Dark race jersey
    const jerseyMat = new THREE.MeshStandardMaterial({
      color: 0x1c1e22,
      roughness: 0.45,
      metalness: 0.3,
    });
    const bibMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.5,
      metalness: 0.2,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x090a0f,
      roughness: 0.08,
      metalness: 0.96,
    });
    const accentBlueMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
    });
    const pedalAmberMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.5,
    });

    // Root bike group
    const bikeGroup = new THREE.Group();
    scene.add(bikeGroup);
    bikeGroup.position.set(0, 0.06, 0);

    // ----------------------------------------------------
    // FRAME GEOMETRY (Proportional Road Bike Dimensions)
    // Wheelbase: ~0.90 (pRear: -0.44, pFront: +0.46)
    // ----------------------------------------------------
    const createTube = (p1: THREE.Vector3, p2: THREE.Vector3, radius: number, mat: THREE.Material) => {
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const geom = new THREE.CylinderGeometry(radius, radius, len, 12);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(p1).addScaledVector(dir, 0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      return mesh;
    };

    const pBB = new THREE.Vector3(0, -0.27, 0);
    const pRear = new THREE.Vector3(-0.44, -0.32, 0);
    const pFront = new THREE.Vector3(0.46, -0.32, 0);
    const pSeatCluster = new THREE.Vector3(-0.13, 0.16, 0);
    const pHeadTop = new THREE.Vector3(0.33, 0.22, 0);
    const pHeadBot = new THREE.Vector3(0.35, 0.10, 0);

    // Main frame aero tubes
    bikeGroup.add(createTube(pHeadTop, pSeatCluster, 0.026, frameMat)); // Top tube
    bikeGroup.add(createTube(pHeadBot, pBB, 0.038, frameMat));          // Down tube
    bikeGroup.add(createTube(pSeatCluster, pBB, 0.030, frameMat));      // Seat tube
    bikeGroup.add(createTube(pHeadTop, pHeadBot, 0.034, frameMat));     // Head tube
    bikeGroup.add(createTube(pHeadBot, pFront, 0.026, frameMat));       // Fork blades

    // White frame accent decals
    const topDecalGeom = new THREE.BoxGeometry(0.32, 0.007, 0.03);
    const topDecal = new THREE.Mesh(topDecalGeom, whiteProMat);
    topDecal.position.set(0.10, 0.19, 0);
    topDecal.rotation.z = -0.13;
    bikeGroup.add(topDecal);

    // Rear triangle stays (left & right)
    [-0.046, 0.046].forEach((z) => {
      const prZ = new THREE.Vector3(pRear.x, pRear.y, z);
      const psZ = new THREE.Vector3(pSeatCluster.x, pSeatCluster.y, z * 0.35);
      const pbZ = new THREE.Vector3(pBB.x, pBB.y, z * 0.75);
      bikeGroup.add(createTube(psZ, prZ, 0.016, frameMat));  // Seat stay
      bikeGroup.add(createTube(pbZ, prZ, 0.020, frameMat));  // Chain stay
    });

    // Seat post & Saddle
    const pSaddleBase = new THREE.Vector3(-0.15, 0.23, 0);
    bikeGroup.add(createTube(pSeatCluster, pSaddleBase, 0.022, darkCarbonMat));

    const saddleGeom = new THREE.BoxGeometry(0.20, 0.028, 0.09);
    const saddle = new THREE.Mesh(saddleGeom, darkCarbonMat);
    saddle.position.set(-0.15, 0.25, 0);
    saddle.rotation.z = -0.05;
    bikeGroup.add(saddle);

    // Cockpit: Stem & Drop bars
    const pStem = new THREE.Vector3(0.39, 0.24, 0);
    bikeGroup.add(createTube(pHeadTop, pStem, 0.022, darkCarbonMat));

    const barGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.24, 8);
    const bar = new THREE.Mesh(barGeom, darkCarbonMat);
    bar.position.copy(pStem);
    bar.rotation.x = Math.PI / 2;
    bikeGroup.add(bar);

    // GPS Computer on out-front mount
    const gpsGeom = new THREE.BoxGeometry(0.04, 0.015, 0.035);
    const gps = new THREE.Mesh(gpsGeom, accentBlueMat);
    gps.position.set(0.42, 0.26, 0);
    bikeGroup.add(gps);

    // Water bottle on down tube
    const bottleGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.14, 10);
    const bottle = new THREE.Mesh(bottleGeom, darkCarbonMat);
    bottle.position.set(0.16, -0.08, 0);
    bottle.rotation.z = 0.88;
    bikeGroup.add(bottle);

    // ----------------------------------------------------
    // WHEELS (50mm Carbon Deep Rims + Disc Rotors + Spokes)
    // ----------------------------------------------------
    const createWheel = () => {
      const wGroup = new THREE.Group();
      // Rubber tire
      const tireGeom = new THREE.TorusGeometry(0.25, 0.024, 10, 32);
      wGroup.add(new THREE.Mesh(tireGeom, tireMat));

      // 50mm Carbon aero rim
      const rimGeom = new THREE.TorusGeometry(0.205, 0.034, 8, 32);
      wGroup.add(new THREE.Mesh(rimGeom, darkCarbonMat));

      // Disc brake rotor
      const rotorGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.007, 16);
      const rotor = new THREE.Mesh(rotorGeom, alloyMat);
      rotor.position.z = -0.032;
      rotor.rotation.x = Math.PI / 2;
      wGroup.add(rotor);

      // Hub
      const hubGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10);
      const hub = new THREE.Mesh(hubGeom, darkCarbonMat);
      hub.rotation.x = Math.PI / 2;
      wGroup.add(hub);

      // 14 spokes for sharp dynamic motion
      for (let i = 0; i < 14; i++) {
        const rad = (i * Math.PI) / 7;
        const spGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.40, 4);
        const sp = new THREE.Mesh(spGeom, alloyMat);
        sp.rotation.z = rad;
        wGroup.add(sp);
      }
      return wGroup;
    };

    const rearWheel = createWheel();
    rearWheel.position.copy(pRear);
    bikeGroup.add(rearWheel);

    const frontWheel = createWheel();
    frontWheel.position.copy(pFront);
    bikeGroup.add(frontWheel);

    // ----------------------------------------------------
    // DRIVETRAIN (Chainring + Cranks + Pedals)
    // ----------------------------------------------------
    const chainringGeom = new THREE.CylinderGeometry(0.105, 0.105, 0.010, 20);
    const chainring = new THREE.Mesh(chainringGeom, darkCarbonMat);
    chainring.position.set(pBB.x, pBB.y, 0.065);
    chainring.rotation.x = Math.PI / 2;
    bikeGroup.add(chainring);

    // Cranks group (rotates around BB)
    const crankGroup = new THREE.Group();
    crankGroup.position.copy(pBB);
    bikeGroup.add(crankGroup);

    const crankLen = 0.14;
    const rCrankGeom = new THREE.BoxGeometry(crankLen, 0.024, 0.015);
    const rightCrank = new THREE.Mesh(rCrankGeom, chromeMat);
    rightCrank.position.set(crankLen / 2, 0, 0.075);
    crankGroup.add(rightCrank);

    const lCrankGeom = new THREE.BoxGeometry(crankLen, 0.024, 0.015);
    const leftCrank = new THREE.Mesh(lCrankGeom, chromeMat);
    leftCrank.position.set(-crankLen / 2, 0, -0.075);
    crankGroup.add(leftCrank);

    // ----------------------------------------------------
    // CYCLIST (Torso, Helmet, Visor, Arms, Dynamic IK Legs)
    // ----------------------------------------------------
    const cyclistGroup = new THREE.Group();
    bikeGroup.add(cyclistGroup);

    // Torso (leaning forward in aggressive aero tuck)
    const torsoGeom = new THREE.CylinderGeometry(0.085, 0.10, 0.38, 10);
    const torso = new THREE.Mesh(torsoGeom, jerseyMat);
    torso.position.set(0.06, 0.34, 0);
    torso.rotation.z = -1.02; // Leaning forward ~58°
    cyclistGroup.add(torso);

    // Team racing stripe on jersey back
    const stripeGeom = new THREE.BoxGeometry(0.015, 0.35, 0.06);
    const stripe = new THREE.Mesh(stripeGeom, whiteProMat);
    stripe.position.set(0.06, 0.37, 0);
    stripe.rotation.z = -1.02;
    cyclistGroup.add(stripe);

    // Head & Aero Road Helmet
    const headGeom = new THREE.SphereGeometry(0.068, 12, 12);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.set(0.30, 0.44, 0);
    cyclistGroup.add(head);

    const helmetGeom = new THREE.ConeGeometry(0.095, 0.25, 10);
    const helmet = new THREE.Mesh(helmetGeom, darkCarbonMat);
    helmet.position.set(0.28, 0.48, 0);
    helmet.rotation.z = 1.35; // Pointing back aero teardrop
    cyclistGroup.add(helmet);

    // Mirrored Visor
    const visorGeom = new THREE.BoxGeometry(0.065, 0.038, 0.11);
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0.35, 0.44, 0);
    cyclistGroup.add(visor);

    // Arms (reaching down to drop bar hoods)
    [-0.08, 0.08].forEach((z) => {
      const armGeom = new THREE.CylinderGeometry(0.024, 0.020, 0.38, 8);
      const arm = new THREE.Mesh(armGeom, jerseyMat);
      arm.position.set(0.30, 0.32, z);
      arm.rotation.z = -0.72;
      cyclistGroup.add(arm);

      // Glove
      const gloveGeom = new THREE.SphereGeometry(0.026, 8, 8);
      const glove = new THREE.Mesh(gloveGeom, darkCarbonMat);
      glove.position.set(0.38, 0.24, z);
      cyclistGroup.add(glove);
    });

    // ----------------------------------------------------
    // ARTICULATED LEGS (Biomechanical 2-Link Inverse Kinematics)
    // Thigh + Calf lengths tuned so legs flex smoothly without hyperextension
    // High-contrast layers: Bib shorts + Warm skin + White Pro Socks + Shoes!
    // ----------------------------------------------------
    const thighLen = 0.35;
    const shinLen = 0.32;

    const createLeg = (isRight: boolean) => {
      const lGroup = new THREE.Group();
      cyclistGroup.add(lGroup);

      const legSkinMat = isRight ? skinMat : farSkinMat;

      // Thigh mesh (quadriceps)
      const thighGeom = new THREE.CylinderGeometry(0.055, 0.044, thighLen, 12);
      const thigh = new THREE.Mesh(thighGeom, legSkinMat);

      // Bib shorts dark upper cuff
      const bibGeom = new THREE.CylinderGeometry(0.06, 0.054, thighLen * 0.52, 12);
      const bib = new THREE.Mesh(bibGeom, bibMat);
      bib.position.y = thighLen * 0.24; // Near hip
      thigh.add(bib);

      // White pro bib gripper band
      const gripperGeom = new THREE.CylinderGeometry(0.058, 0.056, 0.025, 12);
      const gripper = new THREE.Mesh(gripperGeom, whiteProMat);
      gripper.position.y = -0.01;
      thigh.add(gripper);

      lGroup.add(thigh);

      // Knee joint
      const kneeGeom = new THREE.SphereGeometry(0.044, 10, 10);
      const knee = new THREE.Mesh(kneeGeom, legSkinMat);
      lGroup.add(knee);

      // Calf / Shin mesh
      const calfGeom = new THREE.CylinderGeometry(0.040, 0.028, shinLen, 12);
      const calf = new THREE.Mesh(calfGeom, legSkinMat);

      // Crisp white pro cycling sock on lower calf
      const sockGeom = new THREE.CylinderGeometry(0.035, 0.030, shinLen * 0.42, 12);
      const sock = new THREE.Mesh(sockGeom, whiteProMat);
      sock.position.y = -shinLen * 0.28; // Covers lower calf down to ankle
      calf.add(sock);

      lGroup.add(calf);

      // Carbon shoe
      const shoeGroup = new THREE.Group();
      const shoeGeom = new THREE.BoxGeometry(0.12, 0.038, 0.055);
      const shoe = new THREE.Mesh(shoeGeom, darkCarbonMat);
      shoeGroup.add(shoe);

      // Yellow BOA dial accent on shoe
      const dialGeom = new THREE.CylinderGeometry(0.010, 0.010, 0.065, 8);
      const dial = new THREE.Mesh(dialGeom, pedalAmberMat);
      dial.rotation.x = Math.PI / 2;
      shoeGroup.add(dial);
      lGroup.add(shoeGroup);

      // Pedal block with amber reflector
      const pedalGroup = new THREE.Group();
      const pedalGeom = new THREE.BoxGeometry(0.065, 0.015, 0.07);
      const pedal = new THREE.Mesh(pedalGeom, alloyMat);
      pedalGroup.add(pedal);

      const refGeom = new THREE.BoxGeometry(0.010, 0.012, 0.06);
      const ref = new THREE.Mesh(refGeom, pedalAmberMat);
      ref.position.x = 0.032;
      pedalGroup.add(ref);
      lGroup.add(pedalGroup);

      return {
        update: (hip: THREE.Vector3, footTarget: THREE.Vector3, zOffset: number) => {
          const dx = footTarget.x - hip.x;
          const dy = footTarget.y - hip.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          const maxD = thighLen + shinLen - 0.01;
          const minD = Math.abs(thighLen - shinLen) + 0.02;
          dist = Math.max(minD, Math.min(maxD, dist));

          // 2D IK angle: knee bends forward (+X)
          const phi = Math.atan2(dy, dx);
          const cosAlpha = (thighLen * thighLen + dist * dist - shinLen * shinLen) / (2 * thighLen * dist);
          const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));

          // Forward knee position: phi + alpha points knee forward
          const kneeX = hip.x + thighLen * Math.cos(phi + alpha);
          const kneeY = hip.y + thighLen * Math.sin(phi + alpha);
          const kneeZ = zOffset;

          knee.position.set(kneeX, kneeY, kneeZ);

          // Thigh: oriented from knee to hip (+Y points to hip / bib shorts)
          const tMidX = (hip.x + kneeX) / 2;
          const tMidY = (hip.y + kneeY) / 2;
          thigh.position.set(tMidX, tMidY, zOffset);
          const tDir = new THREE.Vector3(hip.x - kneeX, hip.y - kneeY, 0).normalize();
          thigh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tDir);

          // Calf: oriented from foot to knee (+Y points to knee, -Y points to sock/ankle)
          const cMidX = (kneeX + footTarget.x) / 2;
          const cMidY = (kneeY + footTarget.y) / 2;
          calf.position.set(cMidX, cMidY, zOffset);
          const cDir = new THREE.Vector3(kneeX - footTarget.x, kneeY - footTarget.y, 0).normalize();
          calf.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cDir);

          // Shoe & Pedal: level with slight natural foot ankle articulation
          shoeGroup.position.set(footTarget.x + 0.02, footTarget.y, zOffset);
          shoeGroup.rotation.z = 0.10 * Math.sin(phi); // Subtle ankle tilt
          pedalGroup.position.set(footTarget.x, footTarget.y, zOffset);
        },
      };
    };

    const rightLeg = createLeg(true);
    const leftLeg = createLeg(false);

    // Hip positions on saddle
    const rightHip = new THREE.Vector3(-0.12, 0.23, 0.09);
    const leftHip = new THREE.Vector3(-0.12, 0.23, -0.09);

    // ----------------------------------------------------
    // RENDER ANIMATION LOOP
    // ----------------------------------------------------
    const render = () => {
      const curRot = rotRef.current;
      const rotRad = (curRot * Math.PI) / 180;

      // Rotate wheels clockwise when moving forward
      rearWheel.rotation.z = -rotRad;
      frontWheel.rotation.z = -rotRad;

      // Rotate cranks
      const crankAngle = rotRad * 1.5;
      crankGroup.rotation.z = -crankAngle;

      // Pedal positions in local space
      const p1x = pBB.x + crankLen * Math.cos(-crankAngle);
      const p1y = pBB.y + crankLen * Math.sin(-crankAngle);
      const p2x = pBB.x - crankLen * Math.cos(-crankAngle);
      const p2y = pBB.y - crankLen * Math.sin(-crankAngle);

      // Update 2-link IK for both legs
      rightLeg.update(rightHip, new THREE.Vector3(p1x, p1y, 0.12), 0.12);
      leftLeg.update(leftHip, new THREE.Vector3(p2x, p2y, -0.12), -0.12);

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`overflow-visible select-none pointer-events-none ${className}`}
    />
  );
};
