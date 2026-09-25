/**
 * Browser half of render.mjs — draws a splat with Spark the way the site shows
 * it once the entrance has settled, and exposes `window.viewer` to puppeteer.
 *
 * GRADE mirrors the objectModifier in src/components/scene/Scene.tsx in its
 * settled state (no entrance / exit animation), with the default control
 * values from useSceneControls. Keep the two in step if the site's look changes.
 */
import * as THREE from 'three';
import { SparkRenderer, SplatMesh, dyno } from '@sparkjsdev/spark';

const GRADE = `
  vec3 localPos = g.center;
  vec3 rgb = g.rgba.rgb;
  // darken the lower left
  float darkenArea = (1.0 - smoothstep(-4.0, 1.0, localPos.x)) * (1.0 - smoothstep(-6.0, 2.0, localPos.y));
  rgb *= (1.0 - darkenArea * 0.7);
  // bottom-left / bottom-right splat scale boost (0.55 each)
  float bl = (1.0 - smoothstep(-2.0, 3.0, localPos.z)) * (1.0 - smoothstep(-1.5, 1.5, localPos.x));
  g.scales *= (1.0 + bl * 0.55);
  float br = (1.0 - smoothstep(-2.0, 3.0, localPos.z)) * smoothstep(-1.5, 1.5, localPos.x);
  g.scales *= (1.0 + br * 0.55);
  // grass darkening behind the menu (2.35)
  float greenness = rgb.g - max(rgb.r, rgb.b);
  float isGreen = smoothstep(0.05, 0.15, greenness);
  float brightness = (rgb.r + rgb.g + rgb.b) / 3.0;
  float isGrassColor = smoothstep(0.2, 0.4, brightness) * (1.0 - smoothstep(0.7, 0.9, brightness));
  float isRight = smoothstep(-2.0, 4.0, localPos.x);
  float isInMenuArea = 1.0 - smoothstep(-6.0, 2.0, localPos.y);
  rgb *= (1.0 - isGreen * isGrassColor * isRight * isInMenuArea * 2.35);
  // splat blending region: saturation 0.65 (brightness and opacity stay 1.0)
  float inZ = smoothstep(-6.0, -5.0, localPos.z) * (1.0 - smoothstep(2.0, 3.0, localPos.z));
  float inY = smoothstep(-11.0, -10.0, localPos.y) * (1.0 - smoothstep(5.0, 6.0, localPos.y));
  float isBlend = inZ * inY;
  vec3 gray = vec3(dot(rgb, vec3(0.299, 0.587, 0.114)));
  rgb = mix(rgb, mix(gray, rgb, 0.65), isBlend);
  g.rgba.rgb = rgb;
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  // R3F's default camera: created at [0, 2, 4] looking at the origin. The site
  // only ever moves it afterwards, so that orientation holds in every pose.
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  const spark = new SparkRenderer({ renderer });
  scene.add(spark);
  const orbit = new THREE.Group(); // stands in for PresentationControls' group
  scene.add(orbit);
  let mesh = null;

  const setGrade = (on) => {
    mesh.objectModifier = on
      ? dyno.dynoBlock({ gsplat: dyno.Gsplat }, { gsplat: dyno.Gsplat }, ({ gsplat }) => {
          const grade = new dyno.Dyno({
            inTypes: { gsplat: dyno.Gsplat },
            outTypes: { gsplat: dyno.Gsplat },
            statements: ({ inputs, outputs }) =>
              dyno.unindentLines(`
                Gsplat g = ${inputs.gsplat};
                ${GRADE}
                ${outputs.gsplat} = g;
              `),
          });
          return { gsplat: grade.apply({ gsplat }).gsplat };
        })
      : undefined;
    mesh.updateGenerator();
  };

  window.viewer = {
    /** Load a splat in the site's rest pose. Resolves to its splat count. */
    async load(url, { grade = true } = {}) {
      if (mesh) {
        orbit.remove(mesh);
        mesh.dispose();
      }
      mesh = new SplatMesh({ url });
      mesh.position.set(0, -0.5, 0);
      mesh.rotation.set(-1.6, 0, 0);
      orbit.add(mesh);
      await mesh.initialized;
      setGrade(grade);
      return mesh.packedSplats?.numSplats ?? mesh.numSplats;
    },

    /** Draw one view: { w, h, fov, pos: [x, y, z], az, pol (degrees), bg }. */
    async shot({ w, h, fov, pos, az = 0, pol = 0, bg = '#f8f5ef' }) {
      scene.background = new THREE.Color(bg);
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = `${w}px`;
      renderer.domElement.style.height = `${h}px`;
      camera.aspect = w / h;
      camera.fov = fov;
      camera.updateProjectionMatrix();
      camera.position.set(0, 2, 4);
      camera.lookAt(0, 0, 0);
      camera.position.set(...pos);
      orbit.rotation.set((pol * Math.PI) / 180, (az * Math.PI) / 180, 0);
      camera.updateMatrixWorld(); // not in the scene, so not covered below
      scene.updateMatrixWorld(true);
      // Regenerate + depth-sort for this pose and wait for the sort worker, so
      // the frame never shows a stale order. (sorting/sortDirty are Spark
      // internals; if they ever disappear this just stops waiting.)
      for (let pass = 0; pass < 3; pass++) {
        await spark.update({ scene, camera });
        for (let t = 0; t < 2400 && (spark.sorting || spark.sortDirty); t++) await sleep(25);
      }
      renderer.render(scene, camera);
    },
  };
  window.viewerReady = true;
} catch (err) {
  window.viewerError = String(err?.message ?? err);
}
