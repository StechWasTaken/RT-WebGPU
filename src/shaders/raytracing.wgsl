struct Sphere {
    center: vec3f,
    r: f32,
}

struct Ray {
    origin: vec3f,
    direction: vec3f,
}

struct HitRecord {
    p: vec3f,
    normal: vec3f,
    t: f32,
    frontFace: bool,
}

@group(0) @binding(0) var<uniform> canvas: vec2f;
@group(0) @binding(1) var<storage, read> spheres: array<Sphere>;
@group(0) @binding(2) var<uniform> rng: vec2f;

const CAMERA_CENTER = vec3f(0, 0, 0);
const MAX_BOUNCES = 100;

fn random(p: vec2f) -> f32 {
    let h = dot(p * rng, vec2f(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
}

fn randomRange(p: vec2f, min: f32, max: f32) -> f32 {
    return random(p) * (max - min) + min;
}

fn randomUnitVector(p: vec2f) -> vec3f {
    var q: vec3f; 
    var lensq: f32;
    while (true) {
        q = randomRange(p, -1, 1) * vec3f(1,1,1);
        lensq = dot(q, q);
        if (1.175e-38 < lensq && lensq <= 1) {
            break;
        }
    }
    return q / sqrt(lensq);
} 

fn randomOnHemisphere(normal: vec3f, p: vec2f) -> vec3f {
    let onUnitSphere = randomUnitVector(p);
    if (dot(onUnitSphere, normal) > 0.0) {
        return onUnitSphere;
    } else {
        return -onUnitSphere;
    }
}

fn setFaceNormal(record: ptr<function, HitRecord>, ray: Ray, outwardNormal: vec3f) {
    let a = dot(ray.direction, outwardNormal);
    if (a < 0) {
        record.frontFace = true;
        record.normal = outwardNormal;
    } else {
        record.frontFace = false;
        record.normal = -outwardNormal;
    }
}

fn at(ray: Ray, t: f32) -> vec3f {
    return ray.origin + t * ray.direction;
}

fn hitSpheres(spheres: ptr<storage, array<Sphere>>, ray: Ray, record: ptr<function, HitRecord>, rayTmin: f32, rayTmax: f32) -> bool {
    let tempRecord: ptr<function, HitRecord> = record;
    var hitAnything = false;
    var closestSoFar = rayTmax;

    for (var i: u32 = 0; i < arrayLength(spheres); i++) {
        let sphere = spheres[i];
        if (hit(sphere, ray, tempRecord, rayTmin, closestSoFar)) {
            hitAnything = true;
            closestSoFar = tempRecord.t;
            *record = *tempRecord;
        }
    }

    return hitAnything;
}

fn hit(sphere: Sphere, ray: Ray, record: ptr<function, HitRecord>, rayTmin: f32, rayTmax: f32) -> bool {
    let oc = sphere.center - ray.origin;
    let a = dot(ray.direction, ray.direction);
    let h = dot(ray.direction, oc);
    let c = dot(oc, oc) - sphere.r * sphere.r;

    let discriminant = h * h - a * c;
    if (discriminant < 0) {
        return false;
    }
    
    let sqrtd = sqrt(discriminant);

    var root = (h - sqrtd) / a;
    if (root <= rayTmin || rayTmax <= root) {
        root = (h + sqrtd) / a;
        if (root <= rayTmin || rayTmax <= root) {
            return false;
        }
    }

    record.t = root;
    record.p = at(ray, record.t);
    record.normal = (record.p - sphere.center) / sphere.r;

    return true;
}

fn rayColor(spheres: ptr<storage, array<Sphere>>, ray: Ray, p: vec2f) -> vec3f {
    var color = vec3f(1.0, 1.0, 1.0);
    var currentRay = ray;

    var i: u32;
    for (i = 0; i < MAX_BOUNCES; i++) {
        var record = HitRecord();

        if (hitSpheres(spheres, currentRay, &record, 0, 1e16)) {
            let direction = record.normal + randomUnitVector(p);
            currentRay = Ray(record.p, direction);
            color *= 0.5;
        } else {
            let unitDirection = normalize(currentRay.direction);
            let a = 0.5 * (unitDirection.y + 1.0);
            color *= (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0); 
            break;
        }
    }

    if (i == MAX_BOUNCES) {
        return vec3f(0,0,0);
    }

    return color;
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

    let ray = Ray(CAMERA_CENTER, rayDirection);

    let pixelColor = rayColor(&spheres, ray, pos.xy);

    return vec4f(pixelColor, 1.0);
}