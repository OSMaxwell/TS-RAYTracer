import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as utils from './lib/utils';
import * as dat from 'dat.gui';

import { RTRenderCallback, SaveImgCallback } from './main';
import { convertTypeAcquisitionFromJson } from 'typescript';
import type { Scene } from 'three';
import type { CanvasWidget } from './canvasWidget';
import { rayToSphere } from './sphere_helper';
import { checkAndGetReflection } from './reflection';
import { avgColors} from './supersampler';

/*******************************************************************************
 * Helps to build gui, scene, camera and controls
 ******************************************************************************/

export class Settings extends utils.Callbackable {
  maxDepth: number = 2;
  subsamples: number = 1;
  width: number = 256;
  height: number = 256;
  correctSpheres: boolean = false;
  phong: boolean = false;
  alllights: boolean = false;
  shadows: boolean = false;
  mirrors: boolean = false;
  render: () => void = function () { RTRenderCallback() };
  saveImg: () => void = function () { SaveImgCallback() };
}

export function createGUI(params: Settings): dat.GUI {
  var gui: dat.GUI = new dat.GUI();

  gui.add(params, "width").name("Width")
  gui.add(params, "height").name("Height")
  gui.add(params, "correctSpheres").name("Correct Spheres")
  gui.add(params, "phong").name("Phong")
  gui.add(params, "alllights").name("All Lights")
  gui.add(params, "shadows").name("Shadows")
  gui.add(params, "mirrors").name("Mirrors")
  gui.add(params, 'maxDepth', 0, 10, 1).name('Max Recursions')
  gui.add(params, "subsamples", 1, 4, 1).name("Subsamples")
  gui.add(params, "render").name("Render")
  gui.add(params, "saveImg").name("Save")
  return gui;
}


export function setupGeometry(scene: THREE.Scene) {

  var phongMaterialRed = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    specular: 0xaaaaaa,
    shininess: 150,
    reflectivity: 0,
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialRed.mirror = false;

  var phongMaterialGreen = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    specular: 0xaaaaaa,
    shininess: 150,
    reflectivity: 0,
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialGreen.mirror = false;

  var phongMaterialBlue = new THREE.MeshPhongMaterial({
    color: 0x0000ff,
    specular: 0xaaaaaa,
    shininess: 150,
    reflectivity: 0,
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialBlue.mirror = false;

  var phongMaterialSkyblue = new THREE.MeshPhongMaterial({
    color: 'skyblue',
    specular: 0xaaaaaa,
    shininess: 150,
    reflectivity: 0,
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialSkyblue.mirror = false;

  var phongMaterialTop = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x111111,
    shininess: 100,
    reflectivity: 0,
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialTop.mirror = false;

  var phongMaterialGround = new THREE.MeshPhongMaterial({
    color: 0x666666,
    specular: 0x111111,
    shininess: 100,
    reflectivity: 0,
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialGround.mirror = false;

  var mirrorMaterial = new THREE.MeshPhongMaterial({
    color: 0xffaa00,
    specular: 0xffffff,
    shininess: 10000,
    reflectivity: 0.8,
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  mirrorMaterial.mirror = true;

  var greyMirrorMaterial = new THREE.MeshPhongMaterial({
    color: 0x808080,
    specular: 0xffffff,
    shininess: 10000,
    reflectivity: 0.85,
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  greyMirrorMaterial.mirror = true;

  var sphereGeometry = new THREE.SphereGeometry(50 / 300, 8, 4);
  var bigSphereGeometry = new THREE.SphereGeometry(70 / 300, 8, 4);
  var planeGeometry = new THREE.PlaneGeometry(602 / 300, 602 / 300);
  var boxGeometry = new THREE.BoxGeometry(100 / 300, 280 / 300, 100 / 300);
  var sphere = new THREE.Mesh(sphereGeometry, phongMaterialRed);
  sphere.position.set(- 50 / 300, - 250 / 300 + 5 / 300, - 50 / 300);
  scene.add(sphere);
  var sphere2 = new THREE.Mesh(bigSphereGeometry, phongMaterialGreen);
  sphere2.position.set(190 / 300, - 235 / 300 + 5 / 300, - 150 / 300);
  scene.add(sphere2);

  var sphere3 = new THREE.Mesh(sphereGeometry, phongMaterialBlue);
  sphere3.position.set(75 / 300, - 250 / 300 + 5 / 300, - 75 / 300);
  sphere3.rotation.y = 0.5;
  scene.add(sphere3);

  var box = new THREE.Mesh(boxGeometry, greyMirrorMaterial);
  box.position.set(- 175 / 300, -165 / 300 + 2.5 / 300, - 150 / 300);
  box.rotation.y = 0.25;
  scene.add(box);

  // bottom
  var planebottom = new THREE.Mesh(planeGeometry, phongMaterialGround);
  planebottom.position.set(0, - 300 / 300, - 150 / 300);
  planebottom.rotation.x = -1.57;
  planebottom.scale.setY(0.6);
  scene.add(planebottom);

  // top
  var planetop = new THREE.Mesh(planeGeometry, phongMaterialTop);
  planetop.position.set(0, 300 / 300, - 150 / 300);
  planetop.rotation.x = 1.57;
  planetop.scale.setY(0.6);
  scene.add(planetop);

  // back
  var planeback = new THREE.Mesh(planeGeometry, mirrorMaterial);
  planeback.position.set(0, 0, - 300 / 300);
  scene.add(planeback);

  // left
  var planeleft = new THREE.Mesh(planeGeometry, phongMaterialRed);
  planeleft.rotation.z = 1.57;
  planeleft.rotation.y = 1.57;
  planeleft.position.set(- 300 / 300, 0, - 150 / 300);
  planeleft.scale.setY(0.6);
  scene.add(planeleft);

  // right
  var planeright = new THREE.Mesh(planeGeometry, phongMaterialSkyblue);
  planeright.rotation.z = 1.57;
  planeright.rotation.y = -1.57;
  planeright.position.set(300 / 300, 0, - 150 / 300);
  planeright.scale.setY(0.6);
  scene.add(planeright);

  scene.updateMatrixWorld();
  return scene;
};

export function setupLight(scene: THREE.Scene) {
  var intensity = 0.25;
  var lights = [];
  var light1 = new THREE.PointLight(0xffffff, intensity * 2);
  light1.position.set(0, 0, 300 / 300);
  scene.add(light1);
  lights.push(light1);
  light1.updateMatrixWorld();

  var light2 = new THREE.PointLight(0xffaa55, intensity);
  light2.position.set(- 200 / 300, 100 / 300, 100 / 300);
  scene.add(light2);
  lights.push(light2);
  light2.updateMatrixWorld();

  var light3 = new THREE.PointLight(0x55aaff, intensity);
  light3.position.set(200 / 300, 100 / 300, 200 / 300);
  scene.add(light3);
  lights.push(light3);
  light3.updateMatrixWorld();
  return lights;
};

export function setupCamera(camera: THREE.PerspectiveCamera) {
  camera.fov = 60;
  camera.far = 1000;
  camera.near = 0.001;
  camera.position.z = 540 / 300;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera
}

export function setupControls(controls: OrbitControls) {
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.enableZoom = true;
  controls.keys = { LEFT: "KeyA", UP: "KeyW", RIGHT: "KeyD", BOTTOM: "KeyS" };
  controls.listenToKeyEvents(document.body);
  controls.minDistance = 0.00001;
  controls.maxDistance = 9;
  controls.minZoom = 0;
  return controls;
};

// Sort intersections
// Warning CustomIntersection[] has already dummy element as first 
export function getClosestCustomIntersection(intersections: CustomIntersection[]) {
  let closestPoint: CustomIntersection | undefined = intersections.at(1);
  if (closestPoint == undefined) {
    return
  } // This should never happen}
  for (let intersection of intersections) {
    if (intersection == intersections.at(0)) continue;
    if ((intersection.distanceFromOrigin < closestPoint.distanceFromOrigin)) {
      closestPoint = intersection;
    }
  }
  return closestPoint;
}

// THREE JS LIKE
export interface CustomIntersection {
  distanceFromOrigin: number;
  objectColor: THREE.Color;
  worldPosition: THREE.Vector3;
  normal: THREE.Vector3;
  specular: THREE.Color;
  shinines: number;
  isMirror: boolean;
  reflectivitiy: number
}

// Settings like for Rendering
export interface RenderSettings {
  basic: boolean;
  correctSphere: boolean;
  phong: boolean;
  allLights: boolean;
  shadows: boolean;
  mirrors: boolean;
  maxRecursions: number;
  subsamples: number,
  recursions: number; // Used for reflection counting
}

export const defaultRenderSettings: RenderSettings = {
  basic: true,
  correctSphere: false,
  phong: false,
  allLights: false,
  shadows: false,
  mirrors: false,
  maxRecursions: 2,
  subsamples: 1,
  recursions: 0,
}

// Update settings from GUI before start of the render
// Easier than fetching from settings
export function updateRenderSettings(settings: Settings, renderSettings: RenderSettings) {
  renderSettings.basic = false;
  renderSettings.correctSphere = settings.correctSpheres;
  renderSettings.phong = settings.phong;
  renderSettings.allLights = settings.alllights;
  renderSettings.shadows = settings.shadows;
  renderSettings.mirrors = settings.mirrors;

  renderSettings.maxRecursions = settings.maxDepth; // always update
  renderSettings.subsamples = settings.subsamples;

  if (!settings.correctSpheres && !settings.phong &&  // All off
    !settings.alllights && !settings.shadows &&
    !settings.mirrors) renderSettings.basic = true;

  // Fresh render
  renderSettings.recursions = 0;
}

export function RTRenderPass(renderSettings: RenderSettings,
  CanWidget: CanvasWidget, scene: Scene, camera: THREE.PerspectiveCamera) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  console.log("Debug: Sending Rays...");
  console.log("Debug: Image:", CanWidget.Canvas.width, "x", CanWidget.Canvas.width);

  const start = new Date().getTime();

  // Go through Canvas and draw pixels
  for (let w = 0; w < CanWidget.Canvas.width; w++) {
    for (let h = 0; h < CanWidget.Canvas.height; h++) {

      let colors: THREE.Color[] = [] // For subsampling

      // Uniform grid
      for (let y = 0; y < renderSettings.subsamples; y++) {
        for (let x = 0; x < renderSettings.subsamples; x++) {

          // Reflected ray bounce count :reset
          renderSettings.recursions = 0;

          // Set pointer in NDC ( with subsamples)
          pointer.x = (((w + x / renderSettings.subsamples) + 1 / (2 * renderSettings.subsamples)) / CanWidget.Canvas.width) * 2 - 1;
          pointer.y = - (((h + y / renderSettings.subsamples) + 1 / (2 * renderSettings.subsamples)) / CanWidget.Canvas.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera)

          let intersections = intersectRay(raycaster, scene, renderSettings);
          if (intersections.length == 1) {
            colors.push(new THREE.Color('black'))
            continue; // No ray hit, next subpixel
          }
          // Sort for closest
          let closest_point = getClosestCustomIntersection(intersections);

          // Phong Coloring and reflection (Shadowing is included in Phong)
          if (closest_point != undefined) { // Should be always true
            let color = new THREE.Color()
            if (renderSettings.phong && !renderSettings.allLights) {
              const light = getPointLights(scene)[0]; // 1 light
              color = PhongOneLight(light, closest_point, camera, scene, renderSettings);
            }
            else if (renderSettings.phong && renderSettings.allLights) { // All lights (All lights, no phong = checks as both false)
              color = PhongAllLights(getPointLights(scene), closest_point, camera, scene, renderSettings, camera.position);
            }
            else { // No light
              color = closest_point.objectColor;
            }
            // Reflection
            if (renderSettings.mirrors) {
              color = checkAndGetReflection(scene, closest_point, renderSettings, raycaster.ray, camera, color)
            }
            colors.push(color); // Push and go to next subpixel
          } // (closest_point != undefined) END 
        } // X SUBPIXEL LOOP END
      } // Y SUBPIXEL LOOP END
      CanWidget.setPixel(w, h, avgColors(colors), 1); // Color Pixel
    }
  }
  let elapsed = new Date().getTime() - start;
  console.log("Debug: Done in", elapsed / 1000, "seconds.")
}

// Used for long renders.
export function _isitdoingsomething(width: number, height: number, w: number, h: number) {
  if (((width * height) / 0.75) > (w * h)) {
    console.log("Debug: Almost there.");
  }

}
// Ray intersection with objects of scene, returns customIntersection Array
// Supports correct Spheres and Basic Ray casting
export function intersectRay(raycaster: THREE.Raycaster, scene: THREE.Scene, renderSettings: RenderSettings) {
  var cust_intersec: CustomIntersection[] = [
    { // Dummy values. 
      distanceFromOrigin: -1,
      objectColor: new THREE.Color(),
      worldPosition: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      specular: new THREE.Color(),
      shinines: -1,
      isMirror: false,
      reflectivitiy: 0
    }];

  // Traverse scene
  for (let child of scene.children) {
    if (renderSettings.correctSphere) {// Correct Sphere Setting
      let geo = (<THREE.Mesh>child).geometry;
      if (rayToSphere(geo, raycaster, child, cust_intersec)) { // Geomtry is Sphere, Push contents
        continue; // Go to next child
      } else { // Other geomtry
        if (rayToGeometry(raycaster, child, cust_intersec)) { // Geomtry is other, push contents
          continue;
        } // Go to next child
      }// Other geomtry (END)

    } else { // Basic ray casting Setting
      rayToGeometry(raycaster, child, cust_intersec)
    }
  } // END LOOP
  return cust_intersec;
}

// Returns false if not hit, otherwise true and push hit on cust_intersec
function rayToGeometry(raycaster: THREE.Raycaster, child: THREE.Object3D, cust_intersec: CustomIntersection[]) {
  let intersects = raycaster.intersectObject(child, false);
  if (intersects.length == 0) return false; // No ray hit on child

  let firstObj = <THREE.Mesh>(intersects[0].object)
  let material = <THREE.MeshPhongMaterial & { mirror: boolean }>(firstObj.material)

  let normal = new THREE.Vector3();
  if (intersects[0].face?.normal != undefined) {
    //normal = intersects[0].face?.normal.clone().applyMatrix4(firstObj.matrixWorld.clone().invert().transpose()) // Maybe wrong // = camera.matrixWorldInverse * object.matrixWorld
    let normalMatrix = new THREE.Matrix3();
    normalMatrix.getNormalMatrix(intersects[0].object.matrixWorld);
    normal.copy(intersects[0].face?.normal).applyMatrix3(normalMatrix).normalize();
  }

  let color = material.color
  let specular = material.specular
  let shininess = material.shininess;
  let mirror = material.mirror;
  let reflectivity = material.reflectivity;

  cust_intersec.push({
    distanceFromOrigin: intersects[0].distance,
    objectColor: color,
    worldPosition: intersects[0].point.clone(),
    normal: normal,
    specular: specular,
    shinines: shininess,
    isMirror: mirror,
    reflectivitiy: reflectivity,
  });
  return true;
}

// Get all light sources of the scene
export function getPointLights(scene: THREE.Scene) {
  const lights = []
  for (let child of scene.children) {
    if (child instanceof THREE.PointLight)
      lights.push(child)
  }
  return lights
}
// @brief Blinn Phong actual Calculation (Specular and diffuse)
export function getBlinnPhongColor(lightRay: THREE.Vector3, normal: THREE.Vector3, viewRay: THREE.Vector3,
  diffSpecIntencity: THREE.Vector3, m: number, specularColor: THREE.Color, diffuseColor: THREE.Color) {
  // light attuation and three.js factor
  let L_intensity_factor = 1 / (lightRay.length() * lightRay.length()) * 4;

  // Normalize
  let L = lightRay.clone().normalize();
  let E = viewRay.clone().normalize();
  let N = normal.clone().normalize();

  // Diffuse 
  let Id = new THREE.Vector3(0, 0, 0);
  let NL = N.clone().dot(L);
  if (NL >= 0.0) {
    let dif_color = new THREE.Vector3(diffuseColor.r, diffuseColor.g, diffuseColor.b);
    // Id = rd.I_light.(NL)
    Id.multiplyVectors(dif_color, diffSpecIntencity);
    Id.multiplyScalar(NL * L_intensity_factor);
  }

  // Specular
  let Is = new THREE.Vector3(0, 0, 0);
  let HN;
  let H = new THREE.Vector3(0, 0, 0);
  if (NL >= 0.0) {
    H.addVectors(E, L).normalize()
    HN = H.dot(N);
    if (HN > 0.0) {
      let spec_color = new THREE.Vector3(specularColor.r, specularColor.g, specularColor.b);
      //spec_color.normalize();
      Is.multiplyVectors(spec_color, diffSpecIntencity);
      Is.multiplyScalar(Math.pow(HN, m) * L_intensity_factor * m / 50); // THREE JS factor included
    }
  }
  return Id.add(Is);
}
// @brief Blinn Phong for 1 light (Shadow calculation included)
export function PhongOneLight(light: THREE.PointLight, closest_point: CustomIntersection, camera: THREE.PerspectiveCamera,
  scene: THREE.Scene, renderSettings: RenderSettings) {

  let lightRay = new THREE.Vector3() // Shadow Ray
  lightRay.subVectors(light.position, closest_point.worldPosition);

  let viewRay = new THREE.Vector3() // Primary Ray
  viewRay.subVectors(camera.position, closest_point.worldPosition);

  let spec_intensity = new THREE.Vector3(light.color.r, light.color.g, light.color.b);
  spec_intensity.multiplyScalar(light.intensity);

  // --------CAST SHADOW RAY
  if (renderSettings.shadows) {
    const raycaster = new THREE.Raycaster()
    // RAY origin
    raycaster.ray.origin = closest_point?.worldPosition;
    raycaster.ray.origin.add(closest_point.normal.clone().multiplyScalar(0.01));

    // RAY direction
    let dir = new THREE.Vector3();
    dir.subVectors(light.position, closest_point?.worldPosition.clone());
    dir.normalize();
    raycaster.ray.direction = dir;

    // RAY intersections
    let shadowIntersections = intersectRay(raycaster, scene, renderSettings);

    if (shadowIntersections.length > 1) { // Hit -> Shadow
      let closest_shadow_intersection = getClosestCustomIntersection(shadowIntersections);
      if (closest_shadow_intersection != undefined) {
        if (actualShadow(closest_point.worldPosition, light.position, closest_shadow_intersection?.worldPosition)) {
          return new THREE.Color('black'); // darken, skip 
        }
      }
    }
  }
  let color_vec = getBlinnPhongColor(
    lightRay, closest_point.normal, viewRay, spec_intensity,
    closest_point.shinines, closest_point.specular, closest_point.objectColor);
  return new THREE.Color(color_vec.x, color_vec.y, color_vec.z);
}

// @brief Blinn Phong for all lights (Shadow calculation included)
export function PhongAllLights(lights: THREE.PointLight[], closest_point: CustomIntersection,
  camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderSettings: RenderSettings, rayOrigin: THREE.Vector3) {
  let end_color = new THREE.Color(0, 0, 0);
  for (let light of lights) {
    let lightRay = new THREE.Vector3() // Shadow Ray
    lightRay.subVectors(light.position, closest_point.worldPosition);

    let viewRay = new THREE.Vector3() // Primary Ray
    viewRay.subVectors(rayOrigin, closest_point.worldPosition);

    let spec_intensity = new THREE.Vector3(light.color.r, light.color.g, light.color.b); // For Phong calculations
    spec_intensity.multiplyScalar(light.intensity);

    // --------CAST SHADOW RAY
    if (renderSettings.shadows) {
      const raycaster = new THREE.Raycaster()
      // RAY origin
      raycaster.ray.origin = closest_point?.worldPosition;
      raycaster.ray.origin.add(closest_point.normal.clone().multiplyScalar(0.01));

      // RAY direction
      let dir = new THREE.Vector3();
      dir.subVectors(light.position, closest_point?.worldPosition.clone());
      dir.normalize();
      raycaster.ray.direction = dir;

      // RAY intersections
      let shadowIntersections = intersectRay(raycaster, scene, renderSettings);

      if (shadowIntersections.length > 1) { // Hit -> Shadow
        let closest_shadow_intersection = getClosestCustomIntersection(shadowIntersections);
        if (closest_shadow_intersection != undefined) {
          if (actualShadow(closest_point.worldPosition, light.position, closest_shadow_intersection?.worldPosition)) {
            continue; // darken, skip 
          }
        }
      }
    }

    // --------PHONG
    let color_vec = getBlinnPhongColor(
      lightRay, closest_point.normal, viewRay, spec_intensity,
      closest_point.shinines, closest_point.specular, closest_point.objectColor);
    end_color.add(new THREE.Color(color_vec.x, color_vec.y, color_vec.z));
  }
  return end_color;
}

// @brief Test if shadow intersection should be taken
export function actualShadow(intersctionPoint: THREE.Vector3, lightPos: THREE.Vector3, closest_shadow_intersection: THREE.Vector3) {
  let inter_to_light = intersctionPoint.distanceTo(lightPos);
  let inter_to_shadow = intersctionPoint.distanceTo(closest_shadow_intersection)
  if (inter_to_light > inter_to_shadow) {
    return true
  } else return false
}
