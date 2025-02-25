import * as THREE from "three";

export default function initFractalAnimation(): void {
  const container = document.getElementById("three-container");

  if (!container) return console.error("No container found");

  // Create the scene, camera and renderer
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
  camera.position.z = 2;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Geometric configuration
  const geometry = new THREE.PlaneGeometry(4, 4, 100, 100);

  // Shaders customs
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
    varying vec2 vUv;

    float fractal(vec2 uv) {
      vec2 c = uv * 3.0 - vec2(1.5, 1.5);
      vec2 z = vec2(0.0);
      float iterations = 0.0;
      for (int i = 0; i < 100; i++) {
        if (length(z) > 2.0) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        iterations += 1.0;
      }
      return iterations;
    }

    void main() {
      vec2 uv = vUv;
      uv.x += sin(time + uv.y * 10.0) * 0.1;
      uv.y += cos(time + uv.x * 10.0) * 0.1;

      float m = fractal(uv);
      float color = m / 100.0;
      gl_FragColor = vec4(vec3(color), 1.0);
    }
  `;

  // Material with the custom shaders
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    },
    vertexShader,
    fragmentShader,
  });

  // Create a plane and add it to the scene
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  // Adjust the camera aspect ratio when the window is resized
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.resolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  });

  // While the animation is running, update the time uniform
  const clock = new THREE.Clock();

  function animate(): void {
    requestAnimationFrame(animate);
    material.uniforms.time.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  }

  animate();
}