import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const QuantumVisualization: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(4, 4, 100, 100);

    const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

    const fragmentShader = `
        uniform float time;
        uniform vec2 resolution;
        uniform float collapse; // 0.0:
  
        varying vec2 vUv;
  
        float interference(vec2 uv, float t) {
          float wave1 = sin((uv.x + t) * 10.0);
          float wave2 = cos((uv.y - t) * 10.0);
          return (wave1 + wave2) * 0.5;
        }
  
        void main() {
          vec2 uv = vUv;
          
          float pattern = interference(uv, time);
  
          vec3 stateA = vec3(0.2, 0.4, 0.8);
          vec3 stateB = vec3(0.8, 0.3, 0.3);
  
          float blendFactor = 0.5 + 0.5 * sin(time * 2.0);
          vec3 superposition = mix(stateA, stateB, blendFactor);
  
          vec3 finalColor = mix(superposition, stateA, collapse);
  
          finalColor *= 0.5 + 0.5 * pattern;
  
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

    const uniforms = {
      time: { value: 0.0 },
      resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      collapse: { value: 0.0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    const handleClick = () => {
      uniforms.collapse.value = uniforms.collapse.value === 0.0 ? 1.0 : 0.0;
    };
    renderer.domElement.addEventListener("click", handleClick);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      uniforms.time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default QuantumVisualization;