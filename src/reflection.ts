import { CustomIntersection, RenderSettings, intersectRay, getClosestCustomIntersection, PhongOneLight, PhongAllLights, getPointLights } from "./helper";
import * as THREE from 'three'
import type { PerspectiveCamera } from "three";


// @brief reflect an incident ray in intersectionPoint and return reflected color
export function reflect(scene: THREE.Scene, renderSettings: RenderSettings, intersectionPoint: CustomIntersection,
    incidentRay: THREE.Vector3, camera: PerspectiveCamera) {
    let normalizedNormal = intersectionPoint.normal.clone().normalize()

    const raycaster = new THREE.Raycaster()

    let reflectedDir = new THREE.Vector3()
    reflectedDir.subVectors(incidentRay, normalizedNormal.multiplyScalar(incidentRay.dot(normalizedNormal) * 2));
    raycaster.ray.direction = reflectedDir;

    raycaster.ray.origin = intersectionPoint.worldPosition.clone();
    raycaster.ray.origin.add(normalizedNormal.clone().multiplyScalar(0.01));

    // Reflected ray intersections 
    let reflectionIntersections = intersectRay(raycaster, scene, renderSettings);
    renderSettings.recursions++; // reflected a ray! (+1)

    if (reflectionIntersections.length > 1) { // HIT
        let reflectedIntersection = getClosestCustomIntersection(reflectionIntersections);

        let reflection_color = new THREE.Color();
        if (reflectedIntersection != undefined) {
            if (renderSettings.phong && !renderSettings.allLights) {
                const light = getPointLights(scene)[0]; // 1 light
                reflection_color = PhongOneLight(light, reflectedIntersection, camera, scene, renderSettings);
            }
            else if (renderSettings.phong && renderSettings.allLights) {
                reflection_color = PhongAllLights(getPointLights(scene), reflectedIntersection, camera, scene, renderSettings, intersectionPoint.worldPosition);
            }
            else { // No light
                reflection_color = reflectedIntersection.objectColor;
            }
            // Reflection
            if (renderSettings.mirrors) { // Reflect the reflected
                reflection_color = checkAndGetReflection(scene, reflectedIntersection, renderSettings, raycaster.ray, camera, reflection_color)
            }
            return reflection_color;
        } // UNDEFINED (END)
    }
    return new THREE.Color("black") // NO HIT
}

// @brief Check if a surface is reflective and get the the color mix 
// Otherwise return same phong original color 
export function checkAndGetReflection(scene: THREE.Scene, intersectionPoint: CustomIntersection,
    renderSettings: RenderSettings, ray: THREE.Ray, camera: THREE.PerspectiveCamera,
    phongColor: THREE.Color) {
    if ((intersectionPoint.isMirror == true) && (renderSettings.maxRecursions > renderSettings.recursions)) { // Mirror-like
        let reflectivity = intersectionPoint.reflectivitiy;
        let reflectedColor = reflect(scene, renderSettings, // Recursive (all light, one light) [maxrecusursions]
            intersectionPoint, ray.direction.clone(), camera);
        return new THREE.Color().lerpColors(phongColor, reflectedColor, reflectivity) // Return reflections and phong linear
    } else
        return phongColor; // Non mirr-like 
}