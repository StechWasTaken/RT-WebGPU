import squareShader from "./shaders/square.wgsl";
import square from "./shapes/square.js";

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

const canvasDimensions = new Float32Array([canvasWidth, canvasHeight]);

const device = await adapter.requestDevice();
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device: device,
    format: canvasFormat,
});

const uniformBuffer = device.createBuffer({
    label: "canvas dimensions",
    size: canvasDimensions.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(uniformBuffer, 0, canvasDimensions);

const vertexBuffer = device.createBuffer({
    label: "square vertices",
    size: square.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, square);

const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0,
    }],
};

const squareShaderModule = device.createShaderModule({
    label: "square shader",
    code: squareShader,
});

const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, // Uniform used in both stages
        buffer: {
            type: "uniform",
        },
    }],
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
    entries: [{
        binding: 0,
        resource: { 
            buffer: uniformBuffer,
        },
    }],
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
