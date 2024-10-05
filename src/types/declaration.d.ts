declare module '*.wgsl' {
    const value: string;
    export default value;
}

interface Sphere {
    center: Vector3,
    r: number,
    materialIndex: number,
    padding: Vector3,
}

interface Material {
    albedo: Vector3,
    fuzz: number,
    refractionIndex: number,
    id: number,
    padding: Vector2,
}

interface Camera  {
    lookFrom: Vector3,
    vfov: number,
    lookAt: Vector3,
    defocusAngle: number,
    vup: Vector3,
    focusDistance: number,
    imageWidth: number,
    padding: Vector2,
    imageHeight: number,
}

interface CameraData {
    lookFrom: Vector3,
    padding1: number,
    pixel00Location: Vector3,
    padding2: number,
    pixelDeltaU: Vector3,
    padding3: number,
    pixelDeltaV: Vector3,
    padding4: number,
    defocusDiskU: Vector3,
    padding5: number,
    defocusDiskV: Vector3,
    defocusAngle: number,
}

interface ShaderParameters {
    maxBounces: number,
    samplesPerPixel: number,
}

interface Vector4 {
    x: number,
    y: number,
    z: number,
    w: number,
}

interface Vector3 {
    x: number,
    y: number,
    z: number,
}

interface Vector2 {
    x: number,
    y: number,
}
  