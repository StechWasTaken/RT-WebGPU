import raytracingShader from "./shaders/raytracing.wgsl";
import Square from "./classes/shapes/square";
import Sphere from "./classes/shapes/sphere";
import RandomHelper from "./helpers/random-helper";
import Camera from "./classes/camera";
import Vector3 from "./classes/vector3";
import ShaderConfig from "./classes/shader-config";
import Lambertian from "./classes/materials/lambertian";
import Material from "./classes/materials/material";
import Dielectric from "./classes/materials/dielectric";
import Metal from "./classes/materials/metal";
import ArrayEncoder from "./helpers/array-encoder";
import BVH from "./classes/bvh";

if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();

if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const canvas = document.querySelector("canvas");

const device = await adapter.requestDevice();
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device: device,
    format: canvasFormat,
});

const bindGroupLayout = device.createBindGroupLayout({
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, // Uniform used in both stages
            buffer: {
                type: "uniform",
            },
        },
        {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            },
        },
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "uniform",
            },
        },
        {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "uniform",
            },
        },
        {
            binding: 4,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            },
        },
        {
            binding: 5,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            }
        }
    ],
});

const seed = Date.now();
const randomValues = new Float32Array([seed]);

const randomUniformBuffer = device.createBuffer({
    label: "RNG",
    size: randomValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const spheres = new Array<Sphere>();
const materials = new Array<Material>();

const camera = new Camera(
    new Vector3(13, 2, 3),
    new Vector3(0, 0, 0),
    new Vector3(0, 1, 0),
    20,
    0,
    10,
    canvas.width,
    canvas.height,
);

const params = new ShaderConfig(
    5,
    0,
);

const groundMaterial = new Lambertian(new Vector3(0.5,0.5,0.5));
const material1 = new Dielectric(1.5);
const material2 = new Lambertian(new Vector3(0.4,0.2,0.1));
const material3 = new Metal(new Vector3(0.7,0.6,0.5), 0);

materials.push(groundMaterial);
materials.push(material1);
materials.push(material2);
materials.push(material3);

const range = 11;

for (let a = -range; a < range; a++) {
    for (let b = -range; b < range; b++) {
        const chooseMaterial = Math.random();
        const center = new Vector3(
            a * 2.5 + 0.9 * Math.random(),
            0.2,
            b * 1.2 + 0.9 * Math.random(),
        );

        const materialIndex = materials.length;

        if (center.subtract(new Vector3(4,0.2,0)).magnitude() > 0.9) {
            const sphere = new Sphere(center, 0.2, materialIndex);

            spheres.push(sphere);

            if (chooseMaterial < 0.8) { // diffuse
                const randomVector = RandomHelper.randomVector3();
                const albedo = randomVector.multiply(randomVector);
                const material = new Lambertian(albedo);
                materials.push(material);
            }
            else if (chooseMaterial < 0.95) { // metal
                const albedo = RandomHelper.randomVector3(0.5, 1);

                const fuzz = RandomHelper.randomRange(0, 0.5);
                const material = new Metal(albedo, fuzz);
                materials.push(material);
            }
            else { // glass
                const material = new Dielectric(1.5);
                materials.push(material);
            }
        }
    }
}

spheres.push(new Sphere(new Vector3(0,-1000,0), 1000, 0));
spheres.push(new Sphere(new Vector3(0,1,0), 1, 1));
spheres.push(new Sphere(new Vector3(-4,1,0), 1, 2));
spheres.push(new Sphere(new Vector3(4,1,0), 1, 3));

const bvh = new BVH(spheres);

const bufferReadyBVH = bvh.encode();

const bufferReadyMaterials = ArrayEncoder.encode(materials, 8);

const bufferReadySpheres = ArrayEncoder.encode(spheres, 16);

const bufferReadyCameraData = camera.computeViewData().encode();

const shaderConfigBuffer = params.encode();

const square = new Square().encode();

const bvhStorageBuffer = device.createBuffer({
    label: "bounding volume hierarchy",
    size: bufferReadyBVH.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const paramsUniformBuffer = device.createBuffer({
    label: "shader params",
    size: shaderConfigBuffer.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

const cameraViewDataUniformBuffer = device.createBuffer({
    label: "camera data",
    size: bufferReadyCameraData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

const spheresStorageBuffer = device.createBuffer({
    label: "sphere instances",
    size: bufferReadySpheres.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const materialsStorageBuffer = device.createBuffer({
    label: "object materials",
    size: bufferReadyMaterials.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
})

const vertexBuffer = device.createBuffer({
    label: "square vertices",
    size: square.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0,
    }],
};

device.queue.writeBuffer(bvhStorageBuffer, 0, bufferReadyBVH);
device.queue.writeBuffer(spheresStorageBuffer, 0, bufferReadySpheres);
device.queue.writeBuffer(materialsStorageBuffer, 0, bufferReadyMaterials);
device.queue.writeBuffer(randomUniformBuffer, 0, randomValues);
device.queue.writeBuffer(vertexBuffer, 0, square);

const squareShaderModule = device.createShaderModule({
    label: "raytracing shader",
    code: raytracingShader,
});

const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
});

const renderPipeline = device.createRenderPipeline({
    label: "scene render pipeline",
    layout: pipelineLayout,
    vertex: {
        module: squareShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
    },
    fragment: {
        module: squareShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: canvasFormat,
        }],
    },
});

const bindGroup = device.createBindGroup({
    label: "scene renderer bind group",
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: { 
                buffer: cameraViewDataUniformBuffer,
            },
        },
        {
            binding: 1,
            resource: {
                buffer: spheresStorageBuffer,
            }
        },
        {
            binding: 2,
            resource: {
                buffer: randomUniformBuffer,
            }
        },
        {
            binding: 3,
            resource: {
                buffer: paramsUniformBuffer,
            }
        },
        {
            binding: 4,
            resource: {
                buffer: materialsStorageBuffer,
            }
        },
        {
            binding: 5,
            resource: {
                buffer: bvhStorageBuffer,
            }
        }
    ],
});

let lastTime = performance.now();
let frameCount = 0;
let fps = 60;
let fpsUpdateTime = 0;
let angularVelocity = 0;

const fpsCounter = document.querySelector("#fps-counter");
const maxBouncesInput = document.querySelector("#max-bounces");
const samplesPerPixelInput = document.querySelector('#samples-per-pixel');
const rotationSpeedInput = document.querySelector('#rotation-speed');
const labelMaxBouncesInput = document.querySelector("#label-max-bounces");
const labelSamplesPerPixelInput = document.querySelector("#label-samples-per-pixel");
const labelRotationSpeedInput = document.querySelector("#label-rotation-speed");

maxBouncesInput.addEventListener('input', function(event) {
    const target = event.target as HTMLInputElement;
    params.maxBounces = parseInt(target.value);
    const text = target.value.padStart(2, ' ');
    labelMaxBouncesInput.textContent = `MAX BOUNCES PER RAY: ${text}x`;
});

samplesPerPixelInput.addEventListener('input', function(event) {
    const target = event.target as HTMLInputElement;
    params.samplesPerPixel = parseInt(target.value);
    const text = target.value.padStart(2, ' ');
    labelSamplesPerPixelInput.textContent = `SAMPLES PER PIXEL: ${text}x`;
});

rotationSpeedInput.addEventListener('input', function(event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    angularVelocity = value * Math.PI / 180;
    const text = value.toString().padStart(3, ' ');
    labelRotationSpeedInput.textContent = `ROTATION SPEED: ${text} deg p/s`
});

function render(time: DOMHighResTimeStamp) {
    const deltaTime = time - lastTime;
    lastTime = time;

    frameCount++;

    fpsUpdateTime += deltaTime;

    if (fpsUpdateTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        fpsUpdateTime = 0;
        fpsCounter.textContent = `FPS: ${fps}`;
    }
    
    camera.rotate(angularVelocity, deltaTime);

    const cameraViewData = camera.computeViewData().encode();
    const shaderConfig = params.encode();

    device.queue.writeBuffer(cameraViewDataUniformBuffer, 0, cameraViewData);
    device.queue.writeBuffer(paramsUniformBuffer, 0, shaderConfig);

    const encoder = device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "clear",
            storeOp: "store",
        }]
    });

    pass.setPipeline(renderPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroup);
    pass.draw(square.length / 2);

    pass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);