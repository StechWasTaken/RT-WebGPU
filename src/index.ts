import squareShader from "./shaders/square.wgsl";
import raytracingShader from "./shaders/raytracing.wgsl";
import square from "./shapes/square";
import BufferFactory from "./helpers/bufferFactory";
import MaterialFactory from "./helpers/materialFactory";
import SphereFactory from "./helpers/sphereFactory";
import RandomHelper from "./helpers/randomHelper";
import VectorHelper from "./helpers/vectorHelper";
import CameraFactory from "./helpers/cameraFactory";
import CameraHelper from "./helpers/cameraHelper";

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

const padding8b: Vector2 = {
    x: 0,
    y: 0,
}

const camera: Camera = {
    lookFrom: {
        x: 13,
        y:  2,
        z:  3,
    },
    vfov: 20,
    lookAt: {
        x:  0,
        y:  0,
        z:  0,
    },
    defocusAngle: 0.1,
    vup: {
        x:  0,
        y:  1,
        z:  0,
    },
    focusDistance: 10.0,
    imageWidth: canvas.width,
    padding: padding8b,
    imageHeight: canvas.height,
}

const params: ShaderParameters = {
    maxBounces: 5,
    samplesPerPixel: 5,
}

const groundMaterial = MaterialFactory.createLambertian({x: 0.5, y: 0.5, z: 0.5});
spheres.push(SphereFactory.createSphere(0,-1000,0,1000,groundMaterial));

const range = 2;

for (let a = -range; a < range; a++) {
    for (let b = -range; b < range; b++) {
        const chooseMaterial = RandomHelper.random();
        const center: Vector3 = {
            x: a * 2.5 + 0.9 * RandomHelper.random(),
            y: 0.2,
            z: b * 1.2 + 0.9 * RandomHelper.random(),
        }

        if (VectorHelper.magnitude(VectorHelper.subtract(center, {x:4,y:0.2,z:0})) > 0.9) {
            if (chooseMaterial < 0.8) { // diffuse
                const albedo = VectorHelper.multiply(RandomHelper.randomVector3(), RandomHelper.randomVector3());
                const material = MaterialFactory.createLambertian(albedo);
                const sphere = SphereFactory.createSphere(center.x, center.y, center.z, 0.2, material);
                spheres.push(sphere);
            }
            else if (chooseMaterial < 0.95) { // metal
                const albedo: Vector3 = {
                    x: RandomHelper.randomRange(0.5, 1),
                    y: RandomHelper.randomRange(0.5, 1),
                    z: RandomHelper.randomRange(0.5, 1),
                }
                const fuzz = RandomHelper.randomRange(0, 0.5);
                const material = MaterialFactory.createMetal(albedo, fuzz);
                const sphere = SphereFactory.createSphere(center.x, center.y, center.z, 0.2, material);
                spheres.push(sphere);
            }
            else { // glass
                const material = MaterialFactory.createDielectric(1.5);
                const sphere = SphereFactory.createSphere(center.x, center.y, center.z, 0.2, material);
                spheres.push(sphere);
            }
        }
    }
}

const material1 = MaterialFactory.createDielectric(1.5);
spheres.push(SphereFactory.createSphere(0,1,0,1,material1));

const material2 = MaterialFactory.createLambertian({x: 0.4, y: 0.2, z: 0.1});
spheres.push(SphereFactory.createSphere(-4,1,0,1,material2));

const material3 = MaterialFactory.createMetal({x: 0.7, y: 0.6, z: 0.5}, 0.0);
spheres.push(SphereFactory.createSphere(4,1,0,1,material3));

const spheresInfo = BufferFactory.prepareForBuffer(spheres);
const bufferReadySpheres = new Float32Array(spheresInfo.data);

const cameraData = CameraFactory.createCameraData(camera);
const cameraDataInfo = BufferFactory.prepareForBuffer([cameraData]);

const shaderParamsInfo = BufferFactory.prepareForBuffer([params]);

const paramsUniformBuffer = device.createBuffer({
    label: "shader params",
    size: shaderParamsInfo.offset,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

const cameraDataUniformBuffer = device.createBuffer({
    label: "camera data",
    size: cameraDataInfo.offset,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

const spheresStorageBuffer = device.createBuffer({
    label: "sphere instances",
    size: spheresInfo.offset,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

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

device.queue.writeBuffer(spheresStorageBuffer, 0, bufferReadySpheres);
device.queue.writeBuffer(randomUniformBuffer, 0, randomValues);
device.queue.writeBuffer(vertexBuffer, 0, square);

const squareShaderModule = device.createShaderModule({
    label: "square shader",
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
                buffer: cameraDataUniformBuffer,
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
        }
    ],
});

let lastTime = performance.now();
let frameCount = 0;
let fps = 60;
let fpsUpdateTime = 0;
const fpsCounter = document.querySelector(".fps-counter");

function render(time: number) {
    const deltaTime = time - lastTime;
    lastTime = time;

    frameCount++;

    fpsUpdateTime += deltaTime;

    if (fpsUpdateTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        fpsUpdateTime = 0;
        fpsCounter.textContent = `FPS: ${fps.toFixed(2)}`;
        if (fps < 60 && params.samplesPerPixel != 1) {
            params.samplesPerPixel -= Math.floor((60 - fps) / 10);
        }
    
        if (fps > 60) {
            params.samplesPerPixel += Math.floor((fps - 60) / 10);
        }
    }
    
    CameraHelper.rotateCamera(camera, deltaTime, Math.PI / 5000);

    const cameraData = CameraFactory.createCameraData(camera);
    const cameraDataInfo = BufferFactory.prepareForBuffer([cameraData]);
    const bufferReadyCameraData = new Float32Array(cameraDataInfo.data);

    const shaderParamsInfo = BufferFactory.prepareForBuffer([params]);
    const bufferReadyShaderParams = new Float32Array(shaderParamsInfo.data);

    device.queue.writeBuffer(cameraDataUniformBuffer, 0, bufferReadyCameraData);
    device.queue.writeBuffer(paramsUniformBuffer, 0, bufferReadyShaderParams);

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