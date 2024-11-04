import raytracingShader from "./shaders/raytracing.wgsl";
import displayShader from "./shaders/display.wgsl";
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
import Counter from "./classes/counter";
import Geometry from "./classes/shapes/geometry";
import Quad from "./classes/shapes/quad";

let seed = new Counter({min: 0, overflow: true});
let time = new Counter({min: 0, overflow: true});
let frameCount = new Counter({min: 0});
let totalFrameCount = new Counter({min: 1});
let fps = 60;
let fpsUpdateTime = 0;
let angularVelocity = 0;

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

const randomValues = seed.encode();
const objects = new Array<Geometry>();
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
    10,
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
            a + 0.75 * Math.random(),
            0.2,
            b + 0.75 * Math.random(),
        );

        const materialIndex = materials.length;

        if (center.subtract(new Vector3(4,0.2,0)).magnitude() > 0.9) {
            const sphere = new Sphere(center, 0.2, materialIndex);

            objects.push(sphere);

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

objects.push(new Sphere(new Vector3(0,-1000,0), 1000, 0));
objects.push(new Sphere(new Vector3(0,1,0), 1, 1));
objects.push(new Sphere(new Vector3(-4,1,0), 1, 2));
objects.push(new Sphere(new Vector3(4,1,0), 1, 3));

const bvh = new BVH(objects);

const bufferReadyBVH = bvh.encode();
const bufferReadyMaterials = ArrayEncoder.encode(materials, Material.SIZE);
const bufferReadyObjects = ArrayEncoder.encode(objects, Geometry.SIZE);
const bufferReadyCameraData = camera.computeViewData().encode();
const shaderConfigBuffer = params.encode();
const square = new Square().encode();

const randomUniformBuffer = device.createBuffer({
    label: "RNG seed",
    size: randomValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const frameCountBuffer = device.createBuffer({
    label: "frame count",
    size: totalFrameCount.encode().byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const outputTexture = device.createTexture({
    label: "display output texture",
    size: [canvas.width, canvas.height],
    format: "rgba32float",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
});

const inputTexture = device.createTexture({
    label: "display input texture",
    size: [canvas.width, canvas.height],
    format: "rgba32float",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
});

const sampler = device.createSampler({
    magFilter: "nearest",
    minFilter: "nearest",
});

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

const geometryStorageBuffer = device.createBuffer({
    label: "geometry instances",
    size: bufferReadyObjects.byteLength,
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
device.queue.writeBuffer(geometryStorageBuffer, 0, bufferReadyObjects);
device.queue.writeBuffer(materialsStorageBuffer, 0, bufferReadyMaterials);
device.queue.writeBuffer(randomUniformBuffer, 0, randomValues);
device.queue.writeBuffer(vertexBuffer, 0, square);

const computeShaderModule = device.createShaderModule({
    label: "raytracing shader",
    code: raytracingShader,
});

const computePipeline = device.createComputePipeline({
    label: "raytracing compute pipeline",
    layout: device.createPipelineLayout({
        bindGroupLayouts: [device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                    },
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    },
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    },
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                    },
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                    }
                },
                {
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba32float"
                    },
                },
                {
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: {
                        sampleType: "unfilterable-float",
                        viewDimension: "2d",
                        multisampled: false,
                    },
                },
                {
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {
                        type: "non-filtering",
                    },
                },
                {
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    },
                },
            ],
        })]
    }),
    compute: {
        module: computeShaderModule,
        entryPoint: "main",
    },
});

const computeBindGroup = device.createBindGroup({
    label: "compute raytracing bind group",
    layout: computePipeline.getBindGroupLayout(0),
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
                buffer: geometryStorageBuffer,
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
        },
        {
            binding: 6,
            resource: outputTexture.createView(),
        },
        {
            binding: 7,
            resource: inputTexture.createView(),
        },
        {
            binding: 8,
            resource: sampler,
        },
        {
            binding: 9,
            resource: {
                buffer: frameCountBuffer,
            }
        }
    ],
});

const displayShaderModule = device.createShaderModule({
    label: "display shader",
    code: displayShader,
})

const displayPipeline = device.createRenderPipeline({
    label: "render pipeline",
    layout: device.createPipelineLayout({
        bindGroupLayouts: [device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: "unfilterable-float",
                        viewDimension: "2d",
                        multisampled: false,
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: "non-filtering",
                    }
                }
            ]
        })]
    }),
    vertex: {
        module: displayShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
    },
    fragment: {
        module: displayShaderModule,
        entryPoint: "fragmentMain",
        targets: [
            {
                format: canvasFormat,
            }
        ]
    }
});

const displayBindGroup = device.createBindGroup({
    label: "display bind group",
    layout: displayPipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: outputTexture.createView(),
        },
        {
            binding: 1,
            resource: sampler,
        }
    ]
});

const fpsCounter = document.querySelector("#fps-counter");
const maxBouncesInput = document.querySelector("#max-bounces");
const rotationSpeedInput = document.querySelector('#rotation-speed');
const labelMaxBouncesInput = document.querySelector("#label-max-bounces");
const labelRotationSpeedInput = document.querySelector("#label-rotation-speed");

maxBouncesInput.addEventListener('input', function(event) {
    const target = event.target as HTMLInputElement;
    params.maxBounces = parseInt(target.value);
    const text = target.value.padStart(2, ' ');
    labelMaxBouncesInput.textContent = `MAX BOUNCES PER RAY: ${text}x`;
    totalFrameCount.reset();
});

rotationSpeedInput.addEventListener('input', function(event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    angularVelocity = value * Math.PI / 180;
    const text = value.toString().padStart(3, ' ');
    labelRotationSpeedInput.textContent = `ROTATION SPEED: ${text} deg p/s`
    totalFrameCount.reset();
});

canvas.addEventListener('wheel', function(event) {
    camera.zoom(event.deltaY);
    totalFrameCount.reset();
});

function render(currentTime: DOMHighResTimeStamp) {
    time.set(currentTime);

    fpsUpdateTime += time.delta();

    if (fpsUpdateTime >= 1000) {
        fps = frameCount.count;
        frameCount.reset();
        fpsUpdateTime = 0;
        fpsCounter.textContent = `FPS: ${fps}`;
    }
    
    camera.rotate(angularVelocity, time.delta());

    if (angularVelocity !== 0) {
        totalFrameCount.reset();
    }

    const cameraViewData = camera.computeViewData().encode();
    const shaderConfig = params.encode();
    seed.set(Math.floor(performance.now()));

    device.queue.writeBuffer(frameCountBuffer, 0, totalFrameCount.encode());
    device.queue.writeBuffer(randomUniformBuffer, 0, seed.encode());
    device.queue.writeBuffer(cameraViewDataUniformBuffer, 0, cameraViewData);
    device.queue.writeBuffer(paramsUniformBuffer, 0, shaderConfig);

    const encoder = device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(
        Math.ceil(canvas.width / 8),
        Math.ceil(canvas.height / 8),
    );

    computePass.end();

    encoder.copyTextureToTexture(
        {
            texture: outputTexture,
        },
        {
            texture: inputTexture,
        },
        [canvas.width, canvas.height],
    )

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "clear",
            storeOp: "store",
        }]
    });

    pass.setPipeline(displayPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, displayBindGroup);
    pass.draw(square.length / 2);

    pass.end();

    device.queue.submit([encoder.finish()]);

    frameCount.up();
    totalFrameCount.up();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);