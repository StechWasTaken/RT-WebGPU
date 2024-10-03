import squareShader from "./shaders/square.wgsl";
import raytracingShader from "./shaders/raytracing.wgsl";
import square from "./shapes/square";
import BufferFactory from "./helpers/bufferFactory";

if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();

if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const canvas = document.querySelector("canvas");

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

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
            }
        },
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "uniform",
            }
        }
    ],
});

const canvasDimensions = new Float32Array([canvasWidth, canvasHeight]);
const seed = Date.now();
const randomValues = new Float32Array([seed]);

console.log(randomValues);

const canvasUniformBuffer = device.createBuffer({
    label: "canvas dimensions",
    size: canvasDimensions.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const randomUniformBuffer = device.createBuffer({
    label: "RNG",
    size: randomValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const spheres = new Array<Sphere>();

const padding12b: Vector3 = {
    x: 0,
    y: 0,
    z: 0,
}

const materialCenter: Material = {
    albedo: {
        x: 0.1,
        y: 0.2,
        z: 0.5,
    },
    fuzz: 0,
    materialIndex: 1,
    padding: padding12b,
}

const materialGround: Material = {
    albedo: {
        x: 0.8,
        y: 0.8,
        z: 0.0,
    },
    fuzz: 0,
    materialIndex: 1,
    padding: padding12b,
}

const materialLeft: Material = {
    albedo: {
        x: 0.8,
        y: 0.8,
        z: 0.8,
    },
    fuzz: 0.3,
    materialIndex: 2,
    padding: padding12b,
}

const materialRight: Material = {
    albedo: {
        x: 0.8,
        y: 0.6,
        z: 0.2,
    },
    fuzz: 1.0,
    materialIndex: 2,
    padding: padding12b,
}

spheres.push({
    center: {
        x: 0,
        y: 0,
        z: -1.2,
    },
    r: 0.5,
    material: materialCenter,
});

spheres.push({
    center: {
        x: 0,
        y: -100.5,
        z: -1,
    },
    r: 100,
    material: materialGround,
});

spheres.push({
    center: {
        x: 1.0,
        y: 0,
        z: -1,
    },
    r: 0.5,
    material: materialRight,
});

spheres.push({
    center: {
        x: -1.0,
        y: 0,
        z: -1,
    },
    r: 0.5,
    material: materialLeft,
});

const info = BufferFactory.prepareForBuffer(spheres);
const bufferReadySpheres = new Float32Array(info.data);

const spheresStorageBuffer = device.createBuffer({
    label: "sphere instances",
    size: info.offset,
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
device.queue.writeBuffer(canvasUniformBuffer, 0, canvasDimensions);
device.queue.writeBuffer(randomUniformBuffer, 0, randomValues);
device.queue.writeBuffer(vertexBuffer, 0, square);

const squareShaderModule = device.createShaderModule({
    label: "square shader",
    code: raytracingShader,
});

const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
});

const squareRenderPipeline = device.createRenderPipeline({
    label: "square render pipeline",
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
    label: "square renderer bind group",
    layout: squareRenderPipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: { 
                buffer: canvasUniformBuffer,
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
        }
    ],
});

const encoder = device.createCommandEncoder();

const pass = encoder.beginRenderPass({
    colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
    }]
});

pass.setPipeline(squareRenderPipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.setBindGroup(0, bindGroup);
pass.draw(square.length / 2);

pass.end();

device.queue.submit([encoder.finish()]);
