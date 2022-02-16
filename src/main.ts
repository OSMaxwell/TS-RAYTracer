// custom imports
import { CanvasWidget } from './canvasWidget';
import * as helper from './helper';
import * as THREE from 'three';

// @ts-ignore 
import * as utils from './lib/utils';
import RenderWidget from './lib/rendererWidget';
import { Application, createWindow } from './lib/window';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


var scene = new THREE.Scene();
var settings = new helper.Settings()
var CanWidget: CanvasWidget;
var camera = new THREE.PerspectiveCamera();
var renderSettings: helper.RenderSettings = helper.defaultRenderSettings;

// dummy empty render 
function GreenRender(width: number, height: number) {
    let greenColor = new THREE.Color('Green');
    for (let w = 0; w <= width; w++) {
        for (let h = 0; h <= height; h++) {
            CanWidget.setPixel(w, h, greenColor, 1);
        }
    }
}

// @brief Empty the canvas and set all pixels to transparent
function flushImage() {
    let greenColor = new THREE.Color('Green');
    for (let w = 0; w <= CanWidget.Canvas.width; w++) {
        for (let h = 0; h <= CanWidget.Canvas.height; h++) {
            CanWidget.setPixel(w, h, new THREE.Color(), 0);
        }
    }
}
// @brief Start the render process
function RTRender() {
    console.log("Debug: Starting RT Render")

    flushImage();
   
    helper.updateRenderSettings(settings,renderSettings)

    helper.RTRenderPass(renderSettings,CanWidget,scene,camera);
}


export function RTRenderCallback() {
    RTRender()
}

export function SaveImgCallback() {
    CanWidget.savePNG("render")
}

// @brief Only used for changing the dimension:
// PS: If you change the image the rendered Canvas will disappear
function callback(changed: utils.KeyValuePair<helper.Settings>) {
    if (changed.key == 'width') {
        CanWidget.changeDimensions(changed.value, settings.height);
    } else if (changed.key == 'height') {
        CanWidget.changeDimensions(settings.width, changed.value);
    }
}

function main() {
    let root = Application("Ray Tracing");
    root.setLayout([["RTrender", "THREEJSViewport"]]);
    root.setLayoutColumns(["50%", "50%"]);
    root.setLayoutRows(["100%"]);

    // Settings GUI
    let gui = helper.createGUI(settings);
    settings.addCallback(callback);

    let RTrenderDiv = createWindow("RTrender")
    root.appendChild(RTrenderDiv);

    // Ray tracing Render Widget (LEFT)
    CanWidget = new CanvasWidget(RTrenderDiv, settings.width, settings.height);

    // THREE JS VIEWPORT RENDER (RIGHT)
    let THREEJSViewPortDiv = createWindow("THREEJSViewport");
    root.appendChild(THREEJSViewPortDiv);

    // create THREE renderer
    let renderer = new THREE.WebGLRenderer({
        antialias: true,  // to enable anti-alias and get smoother output
    });

    // Create scene and setup
    helper.setupGeometry(scene);

    // Setup Light
    helper.setupLight(scene);

    // Setup Camera
    helper.setupCamera(camera);

    // Setup Controls 
    let controls = new OrbitControls(camera, THREEJSViewPortDiv);
    helper.setupControls(controls);

    // THREE RENDER WIDGET
    let wid = new RenderWidget(THREEJSViewPortDiv, renderer, camera, scene, controls);
    wid.animate()
}

// call main entrypoint
main();
