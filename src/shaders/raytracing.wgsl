struct Material {                               //              align(16)   size(32)
    albedo: vec3f,                              // offset(0)    align(16)   size(12)
    fuzz: f32,                                  // offset(12)   align(4)    size(4)
    refractionIndex: f32,                       // offset(16)   align(4)    size(4)
    @size(12) materialIndex: f32,               // offset(20)   align(12)   size(12)
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

struct Camera {                                 //              align(16)   size(80)
    lookFrom: vec3f,                            // offset(0)    align(16)   size(12)
    fvov: f32,                                  // offset(12)   align(4)    size(4)
    lookAt: vec3f,                              // offset(16)   align(16)   size(12)
    defocusAngle: f32,                          // offset(28)   align(4)    size(4)
    vup: vec3f,                                 // offset(32)   align(16)   size(12)
    focusDistance: f32,                         // offset(44)   align(4)    size(4)
    @size(12) imageWidth: f32,                  // offset(60)   align(16)   size(12)
    imageHeight: f32,                           // offset(64)   align(4)    size(4)
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> spheres: array<Sphere>;
@group(0) @binding(2) var<uniform> rng: u32;

const MAX_BOUNCES = 30;
const SAMPLES_PER_PIXEL = 30;

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

fn randomInUnitDisk(seed: ptr<function, u32>) -> vec3f {
    var p: vec3f;
    while (true) {
        p = vec3f(randomRange(seed, -1, 1), randomRange(seed, -1, 1), 0);
        if (dot(p, p) < 1) {
            break;
        }
    }
    return p;
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
    let center = camera.lookFrom;

    let theta = radians(camera.fvov);
    let h = tan(theta / 2);
    let viewportHeight = 2 * h * camera.focusDistance;
    let viewportWidth = viewportHeight * (f32(camera.imageWidth) / camera.imageHeight);

    let w = normalize(camera.lookFrom - camera.lookAt);
    let u = normalize(cross(camera.vup, w));
    let v = cross(w, u);
    
    let viewportU = viewportWidth * u;
    let viewportV = viewportHeight * -v;

    let pixelDeltaU = viewportU / camera.imageWidth;
    let pixelDeltaV = viewportV / camera.imageHeight;

    let viewportUpperLeft = center - (camera.focusDistance * w) - viewportU / 2 - viewportV / 2;
    let pixel00Location = viewportUpperLeft + 0.5 * (pixelDeltaU + pixelDeltaV);

    let defocusRadius = camera.focusDistance * tan(radians(camera.defocusAngle / 2));
    let defocusDiskU = u * defocusRadius;
    let defocusDiskV = v * defocusRadius;

    let offset = sampleSquare(seed);
    let pixelSample = pixel00Location + ((pos.x + offset.x) * pixelDeltaU) + ((pos.y + offset.y) * pixelDeltaV);
    var rayOrigin: vec3f;
    if (camera.defocusAngle <= 0) {
        rayOrigin = center;
    } else {
        rayOrigin = defocusDiskSample(seed, center, defocusDiskU, defocusDiskV);
    }
    let rayDirection = pixelSample - rayOrigin;

    return Ray(rayOrigin, rayDirection);
}

fn sampleSquare(seed: ptr<function, u32>) -> vec3f {
    return vec3f(random(seed) - 0.5, random(seed) - 0.5, 0);
}

fn defocusDiskSample(seed: ptr<function, u32>, center: vec3f, defocusDiskU: vec3f, defocusDiskV: vec3f) -> vec3f {
    let p = randomInUnitDisk(seed);
    return center + (p.x * defocusDiskU) + (p.y * defocusDiskV);
}

fn at(ray: Ray, t: f32) -> vec3f {
    return ray.origin + t * ray.direction;
}

fn hitSpheres(spheres: ptr<storage, array<Sphere>>, ray: Ray, record: ptr<function, HitRecord>, rayTmin: f32, rayTmax: f32) -> bool {
    let tempRecord: ptr<function, HitRecord> = record;
    var hitAnything = false;
    var closestSoFar = rayTmax;

    for (var i: u32 = 0; i < arrayLength(spheres); i++) {
        if (hit(spheres[i], ray, tempRecord, rayTmin, closestSoFar)) {
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
    else if (record.material.materialIndex == 3) { // dielectric
        *attenuation = vec3f(1.0, 1.0, 1.0);
        var ri: f32;
        if (record.frontFace) {
            ri = 1.0 / record.material.refractionIndex;
        } else {
            ri = record.material.refractionIndex;
        }

        let unitDirection = normalize(incomingRay.direction);

        let cosTheta = min(dot(-unitDirection, record.normal), 1.0);
        let sinTheta = sqrt(1.0 - cosTheta * cosTheta);

        let cannotRefract = ri * sinTheta > 1.0;
        var direction: vec3f;

        if (cannotRefract || reflectance(cosTheta, ri) > random(seed)) {
            direction = reflect(unitDirection, record.normal);
        } else {
            direction = refract(unitDirection, record.normal, ri);
        }

        *scattered = Ray(record.p, direction); 
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

fn reflectance(cosine: f32, refractionIndex: f32) -> f32 {
    var r0 = (1.0 - refractionIndex) / (1 + refractionIndex);
    r0 *= r0;
    return r0 + (1 - r0) * pow((1 - cosine), 5);
}

fn refract(uv: vec3f, n: vec3f, etaIoverEtaT: f32) -> vec3f {
    let cosTheta = min(dot(-uv, n), 1.0);
    let rOutPerp = etaIoverEtaT * (uv + cosTheta * n);
    let rOutParallel = -sqrt(abs(1.0 - dot(rOutPerp, rOutPerp))) * n;
    return rOutPerp + rOutParallel;
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
    let outwardNormal = (record.p - sphere.center) / sphere.r;
    setFaceNormal(record, ray, outwardNormal);
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
            let unitDirection = normalize(currentRay.direction);
            let a = 0.5 * (unitDirection.y + 1.0);
            color *= (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0); 
            break;
        }
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
    var pixelColor = vec3f(0,0,0);

    for (var sample = 0u; sample < SAMPLES_PER_PIXEL; sample++){
        let ray = getRay(pos.xy, &seed);
        pixelColor += rayColor(&spheres, ray, &seed);
    }

    pixelColor /= SAMPLES_PER_PIXEL;

    return vec4f(sqrt(pixelColor), 1.0);
}