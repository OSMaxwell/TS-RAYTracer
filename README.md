## Description

A Typescript Ray-tracer built for university upon THREEJS API and WebGL. If you plan to use it for the same module, please copy carefuly...


![screenshot](https://github.com/OSMaxwell/TS-RAYTracer/blob/main/img/Screenshot.png?raw=true)

## Features 

- Correct sphere intersections. 
- All lights as source in Ray Tracing. (+ Phong Shading)
- Hard shadow Tracing.
- Recursive mirror shading.
- Grid uniform subsampling.


## Requirements

* node.js
* npm
* browser that supports WebGL


## Installation

Run `npm install` in the root of the project directory.


## Run

The command:

`npm run start`

will start a webserver on port 8080 combined with a watcher that recompiles every changed (typescript) file within this folder.


## Developing

The main entrypoint is `src/main.ts`.

The files in `src/lib/` are global utilities used.

Helper files (e.g. `src/helper.ts`) contain specific functions
