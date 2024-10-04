# WebGPU Ray Tracing Project

This project explores the power of WebGPU for real-time rendering, focusing on ray tracing techniques. I am currently studying Software Engineering and have an interest in computer graphics, particularly rendering and physics in game engines.

### Project Overview

This project adapts the concepts from *Ray Tracing in One Weekend* by Peter Shirley to run in WebGPU. It aims to demonstrate ray tracing techniques, such as lighting, reflections, and shadows, using WebGPU's modern pipeline.

### Key Features

- **Ray Tracing**: Implemented with TypeScript and WGSL to simulate *fairly* realistic lighting and reflections.
- **Camera Rotation**: Implemented a fixed camera rotation around the scene, providing a dynamic view of the 3D environment.
- **Multiple Objects**: Supports scenes with multiple spheres, showcasing object interaction in terms of lighting and shadows.

### Approach

While following *Ray Tracing in One Weekend*, I focused on:

- Experiments with structures to ensure proper memory alignment in WebGPU shaders.
- Converting data structures into buffer formats usable in WebGPU.
- Building out scenes with multiple spheres and different materials.

### Citations

[_Ray Tracing in One Weekend_](https://raytracing.github.io/books/RayTracingInOneWeekend.html)