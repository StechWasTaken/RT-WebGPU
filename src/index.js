import vertexShader from "./shaders/vertex.wgsl"
import fragmentShader from "./shaders/fragment.wgsl"

console.log(vertexShader);
console.log(fragmentShader);

const SIZE = 256;

const canvas = document.querySelector("canvas");

if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();

if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device: device,
    format: canvasFormat,
});

const encoder = device.createCommandEncoder();

const pass = encoder.beginRenderPass({
    colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
    }]
});

pass.end();

const commandBuffer = encoder.finish();

device.queue.submit([commandBuffer]);

device.queue.submit([encoder.finish()]);