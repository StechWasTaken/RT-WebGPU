struct Material {                               //              align(16)   size(32)
    albedo: vec3f,                              // offset(0)    align(16)   size(12)
    fuzz: f32,                                  // offset(12)   align(4)    size(4)
    refractionIndex: f32,                       // offset(16)   align(4)    size(4)
    id: f32,                                    // offset(20)   align(4)    size(4)
    // -- implicit struct size padding --       // offset(24)               size(8)
}

struct Interval {                               //              align(4)    size(8)
    min: f32,                                   // offset(0)    align(4)    size(4)
    max: f32,                                   // offset(4)    align(4)    size(4)
}

struct AABB {                                   //              align(4)    size(24)
    x: Interval,                                // offset(0)    align(4)    size(8)
    y: Interval,                                // offset(8)    align(4)    size(8)
    z: Interval,                                // offset(16)   align(4)    size(8)
}

struct BVHNode {                                //              align(16)   size(48)
    @align(16) @size(32) bbox: AABB,            // offset(0)    align(16)   size(32)
    left: f32,                                  // offset(32)   align(4)    size(4)
    right: f32,                                 // offset(36)   align(4)    size(4)
    objectIndex: f32,                           // offset(40)   align(4)    size(4)
    // -- implicit struct size padding --       // offset(44)               size(4)
}

struct Sphere {                                 //              align(16)   size(64)
    center: Ray,                                // offset(0)    align(16)   size(32)
    materialIndex: f32,                         // offset(32)   align(4)    size(4)
    r: f32,                                     // offset(36)   align(4)    size(4)
    bbox: AABB,                                 // offset(40)   align(4)    size(24)
}

struct Ray {                                    //              align(16)   size(32)
    origin: vec3f,                              // offset(0)    align(16)   size(12)
    time: f32,                                  // offset(12)   align(4)    size(4)
    direction: vec3f,                           // offset(16)   align(16)   size(12)
    // -- implicit struct size padding --       // offset(28)               size(4)
}

struct HitRecord {                              //              align(16)   size(48)
    p: vec3f,                                   // offset(0)    align(16)   size(12)
    t: f32,                                     // offset(12)   align(4)    size(4)
    normal: vec3f,                              // offset(16)   align(16)   size(12)
    materialIndex: f32,                         // offset(28)   align(4)    size(4)
    frontFace: bool,                            // offset(32)   align(1)    size(1)
    // -- implicit struct size padding --       // offset(33)               size(11)
}

struct CameraData {                             //              align(16)   size(96)
    lookFrom: vec3f,                            // offset(0)    align(16)   size(12)
    // -- implicit member alignment padding --  // offset(12)               size(4)
    pixel00Location: vec3f,                     // offset(16)   align(16)   size(12)
    // -- implicit member alignment padding --  // offset(28)               size(4)
    pixelDeltaU: vec3f,                         // offset(32)   align(16)   size(12)
    // -- implicit member alignment padding --  // offset(44)               size(4)
    pixelDeltaV: vec3f,                         // offset(48)   align(16)   size(12)
    imageWidth: f32,                            // offset(50)   align(4)    size(4)
    defocusDiskU: vec3f,                        // offset(64)   align(16)   size(12)
    imageHeight: f32,                           // offset(76)   align(4)    size(4)
    defocusDiskV: vec3f,                        // offset(80)   align(16)   size(12)
    defocusAngle: f32,                          // offset(92)   align(4)    size(4)
}

struct Parameters {                             //              align(4)    size(8)
    maxBounces: f32,                            //  offset(0)   align(4)    size(4)
    samplesPerPixel: f32,                       //  offset(4)   align(4)    size(4)
}

@group(0) @binding(0) var<uniform> cameraData: CameraData;
@group(0) @binding(1) var<storage, read> spheres: array<Sphere>;
@group(0) @binding(2) var<uniform> rng: u32;
@group(0) @binding(3) var<uniform> params: Parameters;
@group(0) @binding(4) var<storage, read> materials: array<Material>;
@group(0) @binding(5) var<storage, read> bvh: array<BVHNode>;
@group(0) @binding(6) var outputTexture: texture_storage_2d<rgba32float, write>;
@group(0) @binding(7) var inputTexture: texture_2d<f32>;
@group(0) @binding(8) var colorSampler: sampler;
@group(0) @binding(9) var<uniform> frameCount: f32;

fn lcg_wrap(seed: ptr<function, u32>) -> u32 {
    let a = 1664525u;
    let c = 1013904223u;
    let res = a * (*seed) + c;
    *seed = res;
    return res;
}

fn random_f32(seed: ptr<function, u32>) -> f32 {
    let r = lcg_wrap(seed);
    return f32(r) / 4294967296.0;
}

fn randomRange(seed: ptr<function, u32>, min: f32, max: f32) -> f32 {
    return random_f32(seed) * (max - min) + min;
}

fn hash_u32(x: u32) -> u32 {
    var v = x;
    v = (v + 0x7ed55d16u) + (v << 12);
    v = (v ^ 0xc761c23cu) ^ (v >> 19);
    v = (v + 0x165667b1u) + (v << 5);
    v = (v + 0xd3a2646cu) ^ (v << 9);
    v = (v + 0xfd7046c5u) + (v << 3);
    v = (v ^ 0xb55a4f09u) ^ (v >> 16);
    return v;
}

fn sampleSquare(seed: ptr<function, u32>) -> vec2f {
    return vec2f(random_f32(seed) - 0.5, random_f32(seed) - 0.5);
}

fn randomInUnitDisk(seed: ptr<function, u32>) -> vec3f {
    let theta = 2.0 * 3.14159265359 * random_f32(seed);
    let r = sqrt(max(0.0, random_f32(seed)));
    let x = r * cos(theta);
    let y = r * sin(theta);
    return vec3f(x, y, 0.0);
}

fn randomInHemisphereCosine(normal: vec3f, seed: ptr<function, u32>) -> vec3f {
    let r1 = random_f32(seed);
    let r2 = random_f32(seed);
    let phi = 2.0 * 3.14159265359 * r1;
    let r = sqrt(max(0.0, r2));
    let x = r * cos(phi);
    let y = r * sin(phi);
    let z = sqrt(max(0.0, 1.0 - r2)); // cos(theta)

    // Build an orthonormal basis (u, v, w) with w = normal
    var w = normalize(normal);
    var a = vec3f(0.0, 1.0, 0.0);
    if (abs(w.y) > 0.9) {
        a = vec3f(1.0, 0.0, 0.0);
    }
    var v = normalize(cross(w, a));
    var u = cross(w, v);

    let sample = u * x + v * y + w * z;
    return normalize(sample);
}

fn nearZero(e: vec3f) -> bool {
    let s = 1e-8;
    return (abs(e.x) < s) && (abs(e.y) < s) && (abs(e.z) < s);
}

fn reflect(v: vec3f, n: vec3f) -> vec3f {
    return v - 2.0 * dot(v, n) * n;
}

fn refract(uv: vec3f, n: vec3f, etaIoverEtaT: f32) -> vec3f {
    let cosTheta = min(dot(-uv, n), 1.0);
    let rOutPerp = etaIoverEtaT * (uv + cosTheta * n);
    let rOutParallel = -sqrt(abs(1.0 - dot(rOutPerp, rOutPerp))) * n;
    return rOutPerp + rOutParallel;
}

fn reflectance(cosine: f32, refractionIndex: f32) -> f32 {
    var r0 = (1.0 - refractionIndex) / (1.0 + refractionIndex);
    r0 = r0 * r0;
    return r0 + (1.0 - r0) * pow((1.0 - cosine), 5.0);
}

fn at(ray: Ray, t: f32) -> vec3f {
    return ray.origin + t * ray.direction;
}

fn setFaceNormal(record: ptr<function, HitRecord>, rayDirection: vec3f, outwardNormal: vec3f) {
    let a = dot(rayDirection, outwardNormal);
    if (a < 0.0) {
        record.frontFace = true;
        record.normal = outwardNormal;
    } else {
        record.frontFace = false;
        record.normal = -outwardNormal;
    }
}

fn hit(
    sphere: Sphere,
    ray: Ray,
    record: ptr<function, HitRecord>,
    rayTmin: f32,
    rayTmax: f32,
) -> bool {
    let currentCenter = at(sphere.center, ray.time);
    let oc = currentCenter - ray.origin;
    let a = dot(ray.direction, ray.direction);
    let h = dot(ray.direction, oc);
    let c = dot(oc, oc) - sphere.r * sphere.r;

    let discriminant = h * h - a * c;
    if (discriminant < 0.0) {
        return false;
    }

    let sqrtd = sqrt(discriminant);
    let invA = 1.0 / a;

    var root = (h - sqrtd) * invA;
    if (root <= rayTmin || rayTmax <= root) {
        root = (h + sqrtd) * invA;
        if (root <= rayTmin || rayTmax <= root) {
            return false;
        }
    }

    record.t = root;
    record.p = at(ray, record.t);
    let outwardNormal = normalize(record.p - currentCenter);
    setFaceNormal(record, ray.direction, outwardNormal);
    record.materialIndex = sphere.materialIndex;

    return true;
}

fn vectorAxis(v: vec3f, axis: u32) -> f32 {
    if (axis == 1) {
        return v.y;
    } else if (axis == 2) {
        return v.z;
    }
    return v.x;
}

fn axisInterval(bbox: AABB, axis: u32) -> Interval {
    if (axis == 1) {
        return bbox.y;
    } else if (axis == 2) {
        return bbox.z;
    }
    return bbox.x;
}

fn hitBbox(bbox: AABB, ray: Ray, rayT: Interval) -> bool {
    let rayOrigin = ray.origin;
    let rayDirection = ray.direction;
    var rayTmin = rayT.min;
    var rayTmax = rayT.max;

    for (var axis = 0u; axis < 3u; axis++) {
        let ax = axisInterval(bbox, axis);
        let adinv = 1.0 / vectorAxis(rayDirection, axis);

        var t0 = (ax.min - vectorAxis(rayOrigin, axis)) * adinv;
        var t1 = (ax.max - vectorAxis(rayOrigin, axis)) * adinv;

        if (t0 > t1) {
            let temp = t0;
            t0 = t1;
            t1 = temp;
        }

        rayTmin = max(t0, rayTmin);
        rayTmax = min(t1, rayTmax);

        if (rayTmax <= rayTmin) {
            return false;
        }
    }

    return true;
}

fn hitBVH(
    ray: Ray,
    record: ptr<function, HitRecord>,
    rayT: Interval,
) -> bool {
    var tempRecord = HitRecord();
    var stack: array<i32, 64>; // watch out for this size constant!!! (bvh depth * 2, stack size should not exceed this)
    var stackPtr = 0;

    stack[stackPtr] = 0;

    var hitAnything = false;
    var closestSoFar = rayT.max;

    while (stackPtr >= 0) {
        let currentNode = bvh[stack[stackPtr]];
        stackPtr--;

        let tempRayT = Interval(rayT.min, closestSoFar);

        if (hitBbox(currentNode.bbox, ray, tempRayT)) {
            if (currentNode.objectIndex >= 0) {
                // implement geometry types later...

                if (hit(spheres[i32(currentNode.objectIndex)], ray, &tempRecord, rayT.min, closestSoFar)) {
                    hitAnything = true;
                    closestSoFar = tempRecord.t;
                    *record = tempRecord;
                }
            } else {
                stackPtr++;
                stack[stackPtr] = i32(currentNode.left);
                stackPtr++;
                stack[stackPtr] = i32(currentNode.right);
            }
        }
    }

    return hitAnything;
}

fn scatter(seed: ptr<function, u32>, incomingRay: Ray, record: ptr<function, HitRecord>, attenuation: ptr<function, vec3f>, scattered: ptr<function, Ray>) -> bool {
    let index = u32(record.materialIndex);
    let material = &materials[index];

    if (material.id == 1.0) { // lambertian
        var scatterDirection = randomInHemisphereCosine(record.normal, seed);

        if (nearZero(scatterDirection)) {
            scatterDirection = record.normal;
        }

        *scattered = Ray(record.p, incomingRay.time, scatterDirection);
        *attenuation = material.albedo;
    }
    else if (material.id == 2.0) { // metal
        var reflected = reflect(normalize(incomingRay.direction), record.normal);
        reflected = reflected + material.fuzz * randomInHemisphereCosine(record.normal, seed);
        *scattered = Ray(record.p, incomingRay.time, reflected);
        *attenuation = material.albedo;
    }
    else if (material.id == 3.0) { // dielectric
        *attenuation = vec3f(1.0, 1.0, 1.0);

        var ri = material.refractionIndex;

        if (record.frontFace) {
            ri = 1.0 / material.refractionIndex;
        }

        let unitDirection = normalize(incomingRay.direction);

        let cosTheta = min(dot(-unitDirection, record.normal), 1.0);
        let sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));

        let cannotRefract = ri * sinTheta > 1.0;
        var direction: vec3f;

        if (cannotRefract || reflectance(cosTheta, ri) > random_f32(seed)) {
            direction = reflect(unitDirection, record.normal);
        } else {
            direction = refract(unitDirection, record.normal, ri);
        }

        *scattered = Ray(record.p, incomingRay.time, direction);
    }

    return true;
}

fn rayColor(
    ray: Ray,
    seed: ptr<function, u32>
) -> vec3f {
    var color = vec3f(1.0, 1.0, 1.0);
    var currentRay = ray;

    let maxBounces = u32(params.maxBounces);
    var i: u32 = 0u;

    loop {
        if (i == maxBounces) {
            break;
        }

        var record = HitRecord();
        let rayT = Interval(0.001, 1e16);

        if (!hitBVH(currentRay, &record, rayT)) {
            let unitDirection = normalize(currentRay.direction);
            let a = 0.5 * (unitDirection.y + 1.0);
            color = color * ((1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0));
            break;
        }

        var scattered: Ray;
        var attenuation: vec3f;

        if (!scatter(seed, currentRay, &record, &attenuation, &scattered)) {
            return vec3f(0);
        }

        currentRay = scattered;
        color *= attenuation;

        i++;
    }

    return color;
}

fn luminance(color: vec3f) -> f32 {
    return dot(color, vec3f(0.299, 0.587, 0.114));
}

@compute @workgroup_size(16, 4)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let gx = global_id.x;
    let gy = global_id.y;
    let x = f32(gx);
    let y = f32(gy);

    if (x >= cameraData.imageWidth || y >= cameraData.imageHeight) {
        return;
    }

    let coord = vec2<i32>(i32(gx), i32(gy));
    let currentColor = textureLoad(inputTexture, coord, 0);

    let packed = gx + (gy << 16);
    let fc = u32(frameCount);
    var seed = rng ^ hash_u32(packed + fc);

    let pos = vec2f(x, y);

    let offset = sampleSquare(&seed);
    let samplePos = pos + offset;

    let center = cameraData.lookFrom;
    let pixelSample = cameraData.pixel00Location + samplePos.x * cameraData.pixelDeltaU + samplePos.y * cameraData.pixelDeltaV;

    var rayOrigin: vec3f;
    if (cameraData.defocusAngle <= 0.0) {
        rayOrigin = center;
    } else {
        let d = randomInUnitDisk(&seed);
        rayOrigin = center + d.x * cameraData.defocusDiskU + d.y * cameraData.defocusDiskV;
    }
    let rayDirection = pixelSample - rayOrigin;
    let rayTime = random_f32(&seed);
    let ray = Ray(rayOrigin, rayTime, rayDirection);

    let color = rayColor(ray, &seed);

    let newColor = vec4f(sqrt(color), 1.0);

    let ratio = 1.0 / frameCount;
    let blendedColor = currentColor * (1.0 - ratio) + newColor * ratio;

    textureStore(outputTexture, coord, blendedColor);
}
