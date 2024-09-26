@group(0) @binding(0) var<uniform> canvas: vec2f;

@vertex
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    return vec4f(pos, 0, 1);
}

@fragment
fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    var r = pos.x  / canvas.x;
    var g = pos.y / canvas.y;
    var b = 0.0;

    return vec4f(r, g, b, 1);
}
