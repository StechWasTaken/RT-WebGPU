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
const time = Date.now().toString();
const index = Math.floor(time.length / 2);
const part1 = parseInt(time.slice(0, index));
const part2 = parseInt(time.slice(index));
const randomValues = new Float32Array([part1, part2]);

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

spheres.push({
    center: {
        x: 0,
        y: 0,
        z: -1,
    },
    r: 0.5,
});

spheres.push({
    center: {
        x: 0,
        y: -100.5,
        z: -1,
    },
    r: 100,
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
    multisample: {
        count: 4,
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

const canvasTexture = context.getCurrentTexture();

let multisampleTexture: GPUTexture;

multisampleTexture = device.createTexture({
    format: canvasTexture.format,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    size: [canvasTexture.width, canvasTexture.height],
    sampleCount: 4,
});

const pass = encoder.beginRenderPass({
    colorAttachments: [{
        view: multisampleTexture.createView(),
        resolveTarget: canvasTexture.createView(),
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
