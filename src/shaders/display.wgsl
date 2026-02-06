@group(0) @binding(0) var outputTexture: texture_2d<f32>;
@group(0) @binding(1) var colorSampler: sampler;

@vertex
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    return vec4f(pos, 0, 1);
}

@fragment
fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let texCoord = pos.xy / vec2f(1920, 1080);
    let sampledColor = textureSample(outputTexture, colorSampler, texCoord);
    return sampledColor;
}
