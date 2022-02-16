import * as THREE from 'three';

// @brief Get step size
export function getSuperSampleAmount(superSample: number) {
    return 1 / superSample;
}

// @brief Average all subpixel colors to get one pixel color
export function avgColors(colors: THREE.Color[]) {
    let finalColorVec = new THREE.Vector3();
    for (let color of colors) {
        finalColorVec.x += color.r;
        finalColorVec.y += color.g;
        finalColorVec.z += color.b;
    }
    let len = colors.length
    return new THREE.Color(finalColorVec.x / len, finalColorVec.y / len, finalColorVec.z / len)

}