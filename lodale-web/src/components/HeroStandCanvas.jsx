import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import standGlb from "../assets/3d/Stand/Stand.glb?url";
import baseColorUrl from "../assets/3d/Stand/Textures/Material_Base_color.png";
import normalUrl from "../assets/3d/Stand/Textures/Material_Normal_DirectX.png";
import roughnessUrl from "../assets/3d/Stand/Textures/Material_Roughness.png";
import metallicUrl from "../assets/3d/Stand/Textures/Material_Metallic.png";
import aoUrl from "../assets/3d/Stand/Textures/Material_Mixed_AO.png";

import binocularsGlb from "../assets/3d/Binoculars model/Binoculars.glb?url";
import binoBaseColorUrl from "../assets/3d/Binoculars model/Textures/Main_Base_color.png";
import binoNormalUrl from "../assets/3d/Binoculars model/Textures/Main_Normal_DirectX.png";
import binoRoughnessUrl from "../assets/3d/Binoculars model/Textures/Main_Roughness.png";
import binoMetallicUrl from "../assets/3d/Binoculars model/Textures/Main_Metallic.png";
import binoAoUrl from "../assets/3d/Binoculars model/Textures/Main_Mixed_AO.png";

import cloud1Url from "../assets/3d/Assets/pngwing.com (1).png";
import cloud2Url from "../assets/3d/Assets/pngwing.com (2).png";
import cloud3Url from "../assets/3d/Assets/pngwing.com (3).png";
import cloud4Url from "../assets/3d/Assets/pngwing.com.png";

export default function HeroStandCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);

    // Renderer (antialias: false, alpha: true for transparent canvas)
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3.0);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xe5c583, 1.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight3.position.set(0, 8, -5);
    scene.add(dirLight3);

    // Load Textures
    const textureLoader = new THREE.TextureLoader();
    const baseColorMap = textureLoader.load(baseColorUrl);
    const normalMap = textureLoader.load(normalUrl);
    const roughnessMap = textureLoader.load(roughnessUrl);
    const metallicMap = textureLoader.load(metallicUrl);
    const aoMap = textureLoader.load(aoUrl);

    // Configure GLTF texture properties (flipY = false for GLTF UV map alignment)
    [baseColorMap, normalMap, roughnessMap, metallicMap, aoMap].forEach((tex) => {
      if (tex) {
        tex.flipY = false;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
      }
    });

    baseColorMap.colorSpace = THREE.SRGBColorSpace;

    // Custom PBR Material using the loaded texture maps
    const standMaterial = new THREE.MeshStandardMaterial({
      map: baseColorMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1, -1), // DirectX normal map Y inversion
      roughnessMap: roughnessMap,
      metalnessMap: metallicMap,
      aoMap: aoMap,
      roughness: 1.0,
      metalness: 1.0,
    });

    // Load Binoculars Textures
    const binoBaseColorMap = textureLoader.load(binoBaseColorUrl);
    const binoNormalMap = textureLoader.load(binoNormalUrl);
    const binoRoughnessMap = textureLoader.load(binoRoughnessUrl);
    const binoMetallicMap = textureLoader.load(binoMetallicUrl);
    const binoAoMap = textureLoader.load(binoAoUrl);

    [binoBaseColorMap, binoNormalMap, binoRoughnessMap, binoMetallicMap, binoAoMap].forEach((tex) => {
      if (tex) {
        tex.flipY = false;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
      }
    });

    binoBaseColorMap.colorSpace = THREE.SRGBColorSpace;

    // Binoculars PBR Material
    const binoMaterial = new THREE.MeshStandardMaterial({
      map: binoBaseColorMap,
      normalMap: binoNormalMap,
      normalScale: new THREE.Vector2(1, -1),
      roughnessMap: binoRoughnessMap,
      metalnessMap: binoMetallicMap,
      aoMap: binoAoMap,
      roughness: 1.0,
      metalness: 1.0,
    });

    let modelGroup = null;

    // Load GLTF Model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      standGlb,
      (gltf) => {
        modelGroup = gltf.scene;
        modelGroup.rotation.set(0, 0, 0);
        modelGroup.traverse((child) => {
          if (child.isMesh) {
            child.material = standMaterial;
            child.material.needsUpdate = true;
          }
        });

        // Center model geometry and shift down to the bottom of the hero section
        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        modelGroup.position.sub(center);
        modelGroup.position.x = -size.x * 0.18; // Shifted slightly to the left
        modelGroup.position.y -= size.y * 1.55; // Lowered moderately
        modelGroup.rotation.y = Math.PI / 5.2; // ~35 degree corner Y rotation
        modelGroup.rotation.x = -0.09; // Slight tilt so top face is only faintly visible

        standInitialY = modelGroup.position.y;
        modelGroupRef = modelGroup;
        scene.add(modelGroup);

        if (gltf.animations) {
          gltf.animations = [];
        }

        // Position camera aligned with model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.35;
        if (isNaN(cameraZ) || cameraZ === 0 || !isFinite(cameraZ)) cameraZ = 3.5;

        camera.position.set(0, modelGroup.position.y + size.y * 0.16, cameraZ * 0.9);
        camera.lookAt(-size.x * 0.09, modelGroup.position.y, 0);
        camera.rotateX(0.23);

        // Load Binoculars Model and place sitting on top surface of the Stand box
        gltfLoader.load(
          binocularsGlb,
          (binoGltf) => {
            const binoGroup = binoGltf.scene;
            binoGroup.traverse((child) => {
              if (child.isMesh) {
                child.material = binoMaterial;
                child.material.needsUpdate = true;
              }
            });

            // Calculate world box of stand box
            modelGroup.updateMatrixWorld(true);
            const standWorldBox = new THREE.Box3().setFromObject(modelGroup);

            // Center binoculars geometry
            const binoBox = new THREE.Box3().setFromObject(binoGroup);
            const binoCenter = binoBox.getCenter(new THREE.Vector3());
            const binoSize = binoBox.getSize(new THREE.Vector3());

            binoGroup.position.sub(binoCenter);

            // Fit binoculars proportionally on stand top surface (increased scale)
            const standWidth = size.x;
            const binoMaxDim = Math.max(binoSize.x, binoSize.y, binoSize.z);
            const scale = (standWidth * 0.72) / binoMaxDim;
            binoGroup.scale.set(scale, scale, scale);

            // Orient binoculars and rotate 90 + 20 degrees (110° total) on its vertical Y-axis
            binoGroup.rotation.copy(modelGroup.rotation);
            binoGroup.rotation.y += Math.PI / 2 + (20 * Math.PI / 180);
            binoGroup.updateMatrixWorld(true);

            // Calculate precise world bounding box of rotated binoculars
            const rotatedBinoBox = new THREE.Box3().setFromObject(binoGroup);
            const rotatedBinoSize = rotatedBinoBox.getSize(new THREE.Vector3());

            // Position binoculars to sit directly flush on top surface of the stand box
            binoGroup.position.x = modelGroup.position.x;
            binoGroup.position.y += (standWorldBox.max.y - rotatedBinoBox.min.y) - (rotatedBinoSize.y * 0.38);
            scene.add(binoGroup);
            binoGroupRef = binoGroup;

            // Store initial (start) and final (end) transform for scroll animation
            const startPos = binoGroup.position.clone();
            const startRot = binoGroup.rotation.clone();
            const startScale = binoGroup.scale.clone();

            // End position: lifted off the box, centered comfortably further away from camera lens
            const endPos = new THREE.Vector3(
              0,
              camera.position.y - 0.1,
              camera.position.z - 6.0
            );
            // End rotation: front face of binoculars facing camera directly
            const endRot = new THREE.Euler(0, Math.PI, 0);
            // End scale: comfortable distance view
            const endScale = new THREE.Vector3(
              startScale.x * 0.95,
              startScale.y * 0.95,
              startScale.z * 0.95
            );

            const midPos1 = new THREE.Vector3(
              THREE.MathUtils.lerp(startPos.x, endPos.x, 0.3) + 0.15,
              startPos.y + (endPos.y - startPos.y) * 0.4 + 0.65,
              THREE.MathUtils.lerp(startPos.z, endPos.z, 0.3) + 0.2
            );

            const midPos2 = new THREE.Vector3(
              THREE.MathUtils.lerp(startPos.x, endPos.x, 0.7) - 0.08,
              startPos.y + (endPos.y - startPos.y) * 0.8 + 0.22,
              THREE.MathUtils.lerp(startPos.z, endPos.z, 0.75)
            );

            const startRotVec = new THREE.Vector3(startRot.x, startRot.y, startRot.z);
            const midRotVec1 = new THREE.Vector3(
              THREE.MathUtils.lerp(startRot.x, endRot.x, 0.3) - 0.3,
              THREE.MathUtils.lerp(startRot.y, endRot.y, 0.35) + 0.25,
              startRot.z + 0.12
            );
            const midRotVec2 = new THREE.Vector3(
              THREE.MathUtils.lerp(startRot.x, endRot.x, 0.75) + 0.08,
              THREE.MathUtils.lerp(startRot.y, endRot.y, 0.7),
              THREE.MathUtils.lerp(startRot.z, endRot.z, 0.7) - 0.05
            );
            const endRotVec = new THREE.Vector3(endRot.x, endRot.y, endRot.z);

            binoTransformData = {
              posCurve: new THREE.CatmullRomCurve3([startPos, midPos1, midPos2, endPos], false, "catmullrom", 0.5),
              rotCurve: new THREE.CatmullRomCurve3([startRotVec, midRotVec1, midRotVec2, endRotVec], false, "catmullrom", 0.5),
              scaleCurve: new THREE.CatmullRomCurve3([startScale, startScale.clone().multiplyScalar(1.05), endScale.clone(), endScale], false, "catmullrom", 0.5)
            };
          },
          undefined,
          (err) => {
            console.error("Error loading Binoculars 3D model:", err);
          }
        );
      },
      undefined,
      (err) => {
        console.error("Error loading Stand 3D model:", err);
      }
    );

    let modelGroupRef = null;
    let standInitialY = 0;
    let binoGroupRef = null;
    let binoTransformData = null;
    let targetProgress = 0;
    let currentProgress = 0;

    // Scroll Handler for Hero section progress
    const handleScroll = () => {
      const heroElement = document.getElementById("hero");
      if (!heroElement) return;
      const rect = heroElement.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight > 0) {
        const rawProgress = -rect.top / scrollableHeight;
        targetProgress = THREE.MathUtils.clamp(rawProgress * 2.2, 0, 1);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // Resize Handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      handleScroll();
    };

    window.addEventListener("resize", handleResize);

    // Render Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth lerp transition driven by scroll progress through hero section
      currentProgress += (targetProgress - currentProgress) * 0.08;

      const p = THREE.MathUtils.clamp(currentProgress, 0, 1);

      if (modelGroupRef) {
        const boxEaseP = p * p * (3 - 2 * p); // Smoothstep lowering
        modelGroupRef.position.y = standInitialY - 6.5 * boxEaseP;
      }

      if (binoGroupRef && binoTransformData && binoTransformData.posCurve) {
        const pos = binoTransformData.posCurve.getPoint(p);
        const rot = binoTransformData.rotCurve.getPoint(p);
        const scale = binoTransformData.scaleCurve.getPoint(p);

        binoGroupRef.position.copy(pos);
        binoGroupRef.rotation.x = rot.x;
        binoGroupRef.rotation.y = rot.y;
        binoGroupRef.rotation.z = rot.z;
        binoGroupRef.scale.copy(scale);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none"
      }}
    >
      {/* Stationary HTML cloud PNG images at the bottom edge */}
      <div
        style={{
          position: "absolute",
          bottom: "-12%",
          left: 0,
          width: "100%",
          height: "40%",
          pointerEvents: "none",
          zIndex: 1
        }}
      >
        {/* Outer Left Cloud */}
        <img
          src={cloud4Url}
          alt="Cloud Flank Outer Left"
          style={{
            position: "absolute",
            bottom: "-25%",
            left: "-12%",
            width: "52vw",
            maxWidth: "950px",
            minWidth: "480px",
            opacity: 0.85,
            pointerEvents: "none",
            transform: "scale(1.15)"
          }}
        />
        {/* Inner Left Cloud */}
        <img
          src={cloud3Url}
          alt="Cloud Flank Inner Left"
          style={{
            position: "absolute",
            bottom: "-32%",
            left: "-2%",
            width: "45vw",
            maxWidth: "800px",
            minWidth: "420px",
            opacity: 0.8,
            pointerEvents: "none",
            transform: "scale(1.1)"
          }}
        />
        {/* Inner Right Cloud */}
        <img
          src={cloud1Url}
          alt="Cloud Flank Inner Right"
          style={{
            position: "absolute",
            bottom: "-34%",
            right: "-2%",
            width: "46vw",
            maxWidth: "820px",
            minWidth: "430px",
            opacity: 0.85,
            pointerEvents: "none",
            transform: "scale(1.15)"
          }}
        />
        {/* Outer Right Cloud */}
        <img
          src={cloud2Url}
          alt="Cloud Flank Outer Right"
          style={{
            position: "absolute",
            bottom: "-28%",
            right: "-10%",
            width: "55vw",
            maxWidth: "1000px",
            minWidth: "500px",
            opacity: 0.9,
            pointerEvents: "none",
            transform: "scale(1.2)"
          }}
        />
      </div>
    </div>
  );
}
