struct Material {                               //              align(16)   size(32)
    albedo: vec3f,                              // offset(0)    align(16)   size(12)
    fuzz: f32,                                  // offset(12)   align(4)    size(4)
    @size(16) materialIndex: f32,               // offset(16)   align(16)   size(16)
}

struct Sphere {                                 //              align(16)   size(48)
    center: vec3f,                              // offset(0)    align(16)   size(12)
    r: f32,                                     // offset(12)   align(4)    size(4)
    material: Material,                         // offset(16)   align(16)   size(32)
}

struct Ray {                                    //              align(16)   size(32)
    @size(16) origin: vec3f,                    // offset(0)    align(16)   size(16)
    @size(16) direction: vec3f,                 // offset(16)   align(16)   size(16)
}

struct HitRecord {                              //              align(16)   size(64)
    p: vec3f,                                   // offset(0)    align(16)   size(12)
    t: f32,                                     // offset(12)   align(4)    size(4)
    normal: vec3f,                              // offset(16)   align(16)   size(12)
    @size(4) frontFace: bool,                   // offset(28)   align(4)    size(4)
    material: Material                          // offset(32)   align(16)   size(32)
}

@group(0) @binding(0) var<uniform> canvas: vec2f;
@group(0) @binding(1) var<storage, read> spheres: array<Sphere>;
@group(0) @binding(2) var<uniform> rng: u32;

const CAMERA_CENTER = vec3f(0, 0, 0);
const MAX_BOUNCES = 50;
const SAMPLES_PER_PIXEL = 100;

fn lcg(modulus: u32, a: u32, c: u32, seed: ptr<function, u32>) -> u32 {
    let result = (a * (*seed) + c) % modulus;
    *seed = result;
    return result;
}

fn random(seed: ptr<function, u32>) -> f32 {
    let a = 1664525u;
    let c = 1013904223u;
    let m = 0xFFFFFFFFu;

    let result = lcg(m, a, c, seed);

    return f32(result) / f32(m);
}

fn randomRange(seed: ptr<function, u32>, min: f32, max: f32) -> f32 {
    return random(seed) * (max - min) + min;
}

fn randomUnitVector(seed: ptr<function, u32>) -> vec3f {
    var q: vec3f; 
    var lensq: f32;
    while (true) {
        q = vec3f(randomRange(seed, -1, 1), randomRange(seed, -1, 1), randomRange(seed, -1, 1));
        lensq = dot(q, q);
        if (1.175e-38 < lensq && lensq <= 1) {
            break;
        }
    }
    return q / sqrt(lensq);
} 

fn randomOnHemisphere(normal: vec3f, seed: ptr<function, u32>) -> vec3f {
    let onUnitSphere = randomUnitVector(seed);
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

fn getRay(pos: vec2f, seed: ptr<function, u32>) -> Ray {
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

    let offset = sampleSquare(seed);
    let pixelSample = pixel00Location + ((pos.x + offset.x) * pixelDeltaU) + ((pos.y + offset.y) * pixelDeltaV);
    let rayOrigin = CAMERA_CENTER;
    let rayDirection = pixelSample - rayOrigin;

    return Ray(rayOrigin, rayDirection);
}

fn sampleSquare(seed: ptr<function, u32>) -> vec3f {
    return vec3f(random(seed) - 0.5, random(seed) - 0.5, 0);
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

fn scatter(seed: ptr<function, u32>, incomingRay: Ray, record: HitRecord, attenuation: ptr<function, vec3f>, scattered: ptr<function, Ray>) -> bool {
    
    if (record.material.materialIndex == 1) { // lambertian
        var scatterDirection = record.normal + randomUnitVector(seed);

        if (nearZero(scatterDirection)) {
            scatterDirection = record.normal;
        }

        *scattered = Ray(record.p, scatterDirection);
        *attenuation = record.material.albedo;
    }
    else if (record.material.materialIndex == 2) { // metal
        var reflected = reflect(incomingRay.direction, record.normal);
        reflected = normalize(reflected) + (record.material.fuzz * randomUnitVector(seed));
        *scattered = Ray(record.p, reflected);
        *attenuation = record.material.albedo;
    }

    return true;
}

fn nearZero(e: vec3f) -> bool {
    let s = 1e-8;
    return (abs(e.x) < s) && (abs(e.y) < s) && (abs(e.z) < s);
}

fn reflect(v: vec3f, n: vec3f) -> vec3f {
    return v - 2 * dot(v, n) * n;
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
    record.material = sphere.material;

    return true;
}

fn rayColor(spheres: ptr<storage, array<Sphere>>, ray: Ray, seed: ptr<function, u32>) -> vec3f {
    var color = vec3f(1.0, 1.0, 1.0);
    var previousRay = ray;
    var currentRay = ray;

    var i: u32;
    for (i = 0; i < MAX_BOUNCES; i++) {
        var record = HitRecord();

        if (hitSpheres(spheres, currentRay, &record, 0.001, 1e16)) {
            // let direction = record.normal + randomUnitVector(seed);
            // previousRay = currentRay;
            // currentRay = Ray(record.p, direction);
            var scattered: Ray;
            var attenuation: vec3f;
            if (scatter(seed, currentRay, record, &attenuation, &scattered)) {
                previousRay = currentRay;
                currentRay = scattered;
                color *= attenuation;
            } else {
                return vec3f(0,0,0);
            }
        } else {
            let unitDirection = normalize(previousRay.direction);
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
    var seed = rng * u32(dot(pos,pos)) / u32(pos.x);
    let ray = getRay(pos.xy, &seed);
    var pixelColor = vec3f(0,0,0);
    for (var sample = 0u; sample < SAMPLES_PER_PIXEL; sample++){
        pixelColor += rayColor(&spheres, ray, &seed);
    }

    pixelColor /= SAMPLES_PER_PIXEL;

    return vec4f(pixelColor, 1.0);
}