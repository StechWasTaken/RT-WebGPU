struct VertexInput {
    @location(0) pos: vec2f
    @builtin(instance_index) instance: u32
}

struct VertexOutput {
    @builtin(position) pos: vec4f
    @location(0) cell: vec2f
}

@group(0) @binding(1) var<storage> cellState: array<u32>;

@vector
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.pos = vec4f(input.pos, 0, 1);
    output.cell = input.pos;
    return output;
}