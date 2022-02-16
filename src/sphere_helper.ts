// Sphere functions and stuff
import * as THREE from 'three';
import type { CustomIntersection } from './helper';

// @brief Returns true if child is a sphere, false otherwise.
// If true pushs intersections to cust_intersec
// Not using (getSphereIntersections)
export function rayToSphere(geo: THREE.BufferGeometry, raycaster: THREE.Raycaster, child: THREE.Object3D,
    cust_intersec: CustomIntersection[]) {
    if (geo instanceof THREE.SphereGeometry) { // Sphere!
        let sphere = new THREE.Sphere(child.position, (<THREE.SphereGeometry>geo).parameters.radius);
        let intersectionPoint = new THREE.Vector3();
        
        let t_closest = raycaster.ray.intersectSphere(sphere, intersectionPoint)
        if (t_closest == null) { // no intersection
            return false;
        } else {
            // Fetch needed data
            let wPos = t_closest.clone();
            let distanceFromOrigin = t_closest.distanceTo(raycaster.ray.origin);
            let normal = new THREE.Vector3();
            normal.subVectors(t_closest, child.position); // N normalized!
            normal.normalize();
            let color = (<THREE.MeshPhongMaterial>(<THREE.Mesh>child).material).color;
            let specular = (<THREE.MeshPhongMaterial>(<THREE.Mesh>child).material).specular;
            let shininess = (<THREE.MeshPhongMaterial>(<THREE.Mesh>child).material).shininess;
            let mirror = (<THREE.MeshPhongMaterial & { mirror: boolean }>(<THREE.Mesh>child).material).mirror;
            let reflectivity = (<THREE.MeshPhongMaterial>(<THREE.Mesh>child).material).reflectivity;

            cust_intersec.push({
                distanceFromOrigin: distanceFromOrigin,
                objectColor: color,
                worldPosition: wPos,
                normal: normal,
                specular: specular,
                shinines: shininess,
                isMirror: mirror,
                reflectivitiy: reflectivity,
            });
            return true; // Sphere with coordinates pushed!
        }
    } else { // Not a sphere
        return false;
    }
}

// @brief Not used but this is how sphere intersection should look like. 
function getSphereIntersections(ray: THREE.Vector3, radius: number, center: THREE.Vector3,
    origin: THREE.Vector3) {
    // I also found intersectSphere... 
    let L = center.clone().add(origin.clone().multiplyScalar(-1));
    let t_ca = L.clone().dot(ray);
    let d2 = L.clone().dot(L.clone()) - (t_ca * t_ca);
    if (d2 > radius * radius) return false
    let t_hc = Math.sqrt((radius * radius) - d2);
    return [t_ca - t_hc, t_ca + t_hc];
}