import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function WeatherCanvas({ condition = 'clear', isDay = true }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // --- SETUP SCENE, CAMERA, RENDERER ---
    const scene = new THREE.Scene();
    
    // Set cyberpunk fog
    const fogColor = isDay ? 0x07111e : 0x020205;
    scene.fog = new THREE.FogExp2(fogColor, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 35;
    camera.position.y = 5;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x00f3ff, 1.5);
    mainLight.position.set(0, 20, 10);
    scene.add(mainLight);

    // Cyberpunk grid helper
    const gridColor = isDay ? 0x008cff : 0x00f3ff;
    const gridHelper = new THREE.GridHelper(120, 60, gridColor, gridColor);
    gridHelper.position.y = -15;
    gridHelper.material.opacity = 0.08;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // --- CREATE SYSTEMS ---
    let particlesCount = 2000;
    
    // Ambient stars / dust
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(particlesCount * 3);
    const dustSpeeds = [];

    for (let i = 0; i < particlesCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 150;
      dustPositions[i + 1] = (Math.random() - 0.5) * 100 + 10;
      dustPositions[i + 2] = (Math.random() - 0.5) * 150;
      dustSpeeds.push((Math.random() + 0.1) * 0.05);
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    // 3D Weather specific meshes
    let weatherMesh = null;
    let weatherGeometry = null;
    let weatherMaterial = null;
    const weatherPositionsArray = [];

    const weatherCond = condition.toLowerCase();

    // 1. Rain particles
    if (weatherCond.includes('rain')) {
      const rainCount = 1500;
      weatherGeometry = new THREE.BufferGeometry();
      const rainPositions = new Float32Array(rainCount * 3);
      
      for (let i = 0; i < rainCount * 3; i += 3) {
        rainPositions[i] = (Math.random() - 0.5) * 100;
        rainPositions[i + 1] = Math.random() * 50 - 15;
        rainPositions[i + 2] = (Math.random() - 0.5) * 100;
        
        // Custom rain speeds and lengths
        weatherPositionsArray.push({
          x: rainPositions[i],
          y: rainPositions[i + 1],
          z: rainPositions[i + 2],
          speed: Math.random() * 0.8 + 0.6,
          len: Math.random() * 1.5 + 0.8
        });
      }

      weatherGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
      
      // Render rain as custom glowing points
      weatherMaterial = new THREE.PointsMaterial({
        size: 0.35,
        color: 0x00a8ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      
      weatherMesh = new THREE.Points(weatherGeometry, weatherMaterial);
      scene.add(weatherMesh);
    } 
    // 2. Snow particles
    else if (weatherCond.includes('snow')) {
      const snowCount = 1000;
      weatherGeometry = new THREE.BufferGeometry();
      const snowPositions = new Float32Array(snowCount * 3);

      for (let i = 0; i < snowCount * 3; i += 3) {
        snowPositions[i] = (Math.random() - 0.5) * 100;
        snowPositions[i + 1] = Math.random() * 50 - 15;
        snowPositions[i + 2] = (Math.random() - 0.5) * 100;

        weatherPositionsArray.push({
          x: snowPositions[i],
          y: snowPositions[i + 1],
          z: snowPositions[i + 2],
          speed: Math.random() * 0.1 + 0.05,
          swing: Math.random() * 0.05 + 0.02,
          swingPhase: Math.random() * Math.PI * 2
        });
      }

      weatherGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
      weatherMaterial = new THREE.PointsMaterial({
        size: 0.45,
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });

      weatherMesh = new THREE.Points(weatherGeometry, weatherMaterial);
      scene.add(weatherMesh);
    }
    // 3. Sunny glowing orb & light shafts
    else if (weatherCond.includes('clear')) {
      const sunGeo = new THREE.SphereGeometry(6, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({
        color: isDay ? 0xffaa00 : 0xd8e2dc,
        transparent: true,
        opacity: 0.85
      });
      weatherMesh = new THREE.Mesh(sunGeo, sunMat);
      weatherMesh.position.set(0, 18, -40);
      scene.add(weatherMesh);

      // Sun halo glow ring
      const ringGeo = new THREE.RingGeometry(7, 10, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isDay ? 0xffea00 : 0x00d2ff,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 18, -39.9);
      scene.add(ring);
    }
    // 4. Cloudy drifting layers
    else if (weatherCond.includes('cloudy') || weatherCond.includes('fog')) {
      // Draw puffy glowing shapes
      const cloudGroup = new THREE.Group();
      const cloudCount = 12;
      const cloudsArray = [];

      for (let i = 0; i < cloudCount; i++) {
        const size = Math.random() * 8 + 6;
        const cloudGeo = new THREE.SphereGeometry(size, 8, 8);
        const cloudMat = new THREE.MeshLambertMaterial({
          color: isDay ? 0x6e809c : 0x1d2433,
          transparent: true,
          opacity: 0.25,
          flatShading: true
        });
        const mesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.position.set(
          (Math.random() - 0.5) * 80,
          Math.random() * 10 + 10,
          (Math.random() - 0.5) * 40 - 20
        );
        cloudGroup.add(mesh);
        cloudsArray.push({
          mesh,
          speed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
        });
      }
      weatherMesh = cloudGroup;
      scene.add(cloudGroup);
      weatherPositionsArray.push(...cloudsArray); // reuse position tracker for horizontal cloud drift
    }
    // 5. Thunderstorm (clouds + lightning)
    else if (weatherCond.includes('thunderstorm')) {
      const stormGroup = new THREE.Group();
      
      // Rain overlay for storm
      const stormRainCount = 1000;
      const stormRainGeo = new THREE.BufferGeometry();
      const stormRainPos = new Float32Array(stormRainCount * 3);

      for (let i = 0; i < stormRainCount * 3; i += 3) {
        stormRainPos[i] = (Math.random() - 0.5) * 100;
        stormRainPos[i + 1] = Math.random() * 50 - 15;
        stormRainPos[i + 2] = (Math.random() - 0.5) * 100;
        weatherPositionsArray.push({
          x: stormRainPos[i],
          y: stormRainPos[i + 1],
          z: stormRainPos[i + 2],
          speed: Math.random() * 0.9 + 0.8
        });
      }

      stormRainGeo.setAttribute('position', new THREE.BufferAttribute(stormRainPos, 3));
      const rainMat = new THREE.PointsMaterial({
        size: 0.35,
        color: 0x485e7d,
        transparent: true,
        opacity: 0.7
      });
      const rainPoints = new THREE.Points(stormRainGeo, rainMat);
      stormGroup.add(rainPoints);

      // Dark massive cloud centers
      for (let i = 0; i < 8; i++) {
        const cloudGeo = new THREE.SphereGeometry(Math.random() * 10 + 8, 8, 8);
        const cloudMat = new THREE.MeshLambertMaterial({
          color: 0x090f1a,
          transparent: true,
          opacity: 0.4,
          flatShading: true
        });
        const mesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.position.set((Math.random() - 0.5) * 80, Math.random() * 8 + 12, (Math.random() - 0.5) * 40 - 20);
        stormGroup.add(mesh);
      }

      weatherMesh = stormGroup;
      scene.add(stormGroup);
    }

    // --- ANIMATION FRAME LOOP ---
    let frameId;
    let clock = new THREE.Clock();
    
    // Dynamic lighting for lightning strikes
    let lightningTimer = 0;
    let isFlashing = false;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Slowly spin grid and starfield
      gridHelper.rotation.y = time * 0.015;
      dustPoints.rotation.y = time * 0.005;
      dustPoints.rotation.x = time * 0.002;

      const positions = dustGeometry.attributes.position.array;
      for (let i = 0; i < particlesCount; i++) {
        positions[i * 3 + 1] -= dustSpeeds[i];
        if (positions[i * 3 + 1] < -30) {
          positions[i * 3 + 1] = 50;
        }
      }
      dustGeometry.attributes.position.needsUpdate = true;

      // Update specific weather effects
      if (weatherMesh) {
        // Rain animation
        if (weatherCond.includes('rain')) {
          const rainPos = weatherGeometry.attributes.position.array;
          for (let i = 0; i < weatherPositionsArray.length; i++) {
            const data = weatherPositionsArray[i];
            data.y -= data.speed;
            if (data.y < -15) {
              data.y = 35;
              data.x = (Math.random() - 0.5) * 100;
            }
            rainPos[i * 3] = data.x;
            rainPos[i * 3 + 1] = data.y;
          }
          weatherGeometry.attributes.position.needsUpdate = true;
        }
        // Snow animation
        else if (weatherCond.includes('snow')) {
          const snowPos = weatherGeometry.attributes.position.array;
          for (let i = 0; i < weatherPositionsArray.length; i++) {
            const data = weatherPositionsArray[i];
            data.y -= data.speed;
            data.swingPhase += data.swing;
            const xOffset = Math.sin(data.swingPhase) * 0.15;
            
            if (data.y < -15) {
              data.y = 35;
              data.x = (Math.random() - 0.5) * 100;
            }
            
            snowPos[i * 3] = data.x + xOffset;
            snowPos[i * 3 + 1] = data.y;
          }
          weatherGeometry.attributes.position.needsUpdate = true;
        }
        // Clear Day/Night rotation
        else if (weatherCond.includes('clear')) {
          weatherMesh.rotation.y = time * 0.05;
          weatherMesh.rotation.x = time * 0.03;
        }
        // Cloudy drifting
        else if (weatherCond.includes('cloudy') || weatherCond.includes('fog')) {
          weatherPositionsArray.forEach(cloud => {
            cloud.mesh.position.x += cloud.speed;
            if (cloud.mesh.position.x > 80) cloud.mesh.position.x = -80;
            if (cloud.mesh.position.x < -80) cloud.mesh.position.x = 80;
          });
        }
        // Thunderstorm lightning strikes
        else if (weatherCond.includes('thunderstorm')) {
          // Rain drift in storm
          const stormRainPoints = weatherMesh.children[0];
          const stormRainPositions = stormRainPoints.geometry.attributes.position.array;
          for (let i = 0; i < weatherPositionsArray.length; i++) {
            const data = weatherPositionsArray[i];
            data.y -= data.speed;
            data.x -= 0.15; // angle drift from heavy winds!
            if (data.y < -15) {
              data.y = 35;
              data.x = (Math.random() - 0.5) * 100;
            }
            stormRainPositions[i * 3] = data.x;
            stormRainPositions[i * 3 + 1] = data.y;
          }
          stormRainPoints.geometry.attributes.position.needsUpdate = true;

          // Lightning Flash timing
          lightningTimer += 1;
          if (lightningTimer > Math.random() * 200 + 150) {
            isFlashing = true;
            lightningTimer = 0;
          }

          if (isFlashing) {
            const randFlash = Math.random();
            if (randFlash > 0.85) {
              mainLight.intensity = 8.0;
              scene.background = new THREE.Color(isDay ? 0x6e809c : 0x2d3a4f);
              scene.fog.color = new THREE.Color(isDay ? 0x6e809c : 0x2d3a4f);
            } else if (randFlash > 0.4) {
              mainLight.intensity = 0.2;
              scene.background = null;
              scene.fog.color = new THREE.Color(fogColor);
            } else {
              isFlashing = false;
              mainLight.intensity = 1.5;
              scene.background = null;
              scene.fog.color = new THREE.Color(fogColor);
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- HANDLE WINDOW RESIZE ---
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      
      // Clean up geometries and materials to avoid memory leaks
      dustGeometry.dispose();
      dustMaterial.dispose();
      if (weatherGeometry) weatherGeometry.dispose();
      if (weatherMaterial) weatherMaterial.dispose();
    };
  }, [condition, isDay]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
