@group(0) @binding(0) var<uniform> canvas: vec2f;

const CAMERA_CENTER = vec3f(0, 0, 0);

fn rayAt(origin: vec3f, rayDirection: vec3f, t: f32) -> vec3f {
    return origin + t * rayDirection;
}

fn hasHitSphere(center: vec3f, radius: f32, rayOrigin: vec3f, rayDirection: vec3f) -> f32 {
    let oc = center - rayOrigin;
    let a = length(rayDirection);
    let h = dot(rayDirection, oc);
    let c = length(oc) - radius * radius;
    let discriminant = h * h - a * c;
    
    if (discriminant < 0) {
        return -1.0;
    } else {
        return (h - sqrt(discriminant)) / a;
    }
}

fn rayColor(rayOrigin: vec3f, rayDirection: vec3f) -> vec3f {
    let t = hasHitSphere(vec3f(0, 0, -1), 0.5, rayOrigin, rayDirection);
    
    if (t > 0.0) {
        let N = normalize(rayAt(rayOrigin, rayDirection, t) - vec3(0, 0, -1));
        return 0.5 * (N + 1);
    }

    let unitDirection = normalize(rayDirection);
    let a = 0.5 * (unitDirection.y + 1.0);
    return (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
}

@vertex
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    return vec4f(pos, 0, 1);
}

@fragment
fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let canvasHeight = canvas.y;
    let canvasWidth = canvas.x;
    let ratio = canvasHeight / canvasWidth;

    let focalLength = 1.0;
    let viewportHeight = 2.0;
    let viewportWidth = viewportHeight * (f32(canvasWidth) / canvasHeight);
    
    let viewportU = vec3f(viewportWidth, 0, 0);
    let viewportV = vec3f(0, -viewportHeight, 0);

    let pixelDeltaU = viewportU / canvasWidth;
    let pixelDeltaV = viewportV / canvasHeight;

    let viewportUpperLeft = CAMERA_CENTER - vec3f(0, 0, focalLength) - viewportU/2 - viewportV/2;
    let pixel00Location = viewportUpperLeft + 0.5 * (pixelDeltaU + pixelDeltaV);

    let pixelCenter = pixel00Location + (pos.x * pixelDeltaU) + (pos.y * pixelDeltaV);
    let rayDirection = pixelCenter - CAMERA_CENTER;

    let pixelColor = rayColor(CAMERA_CENTER, rayDirection);

    return vec4f(pixelColor, 1.0);
}