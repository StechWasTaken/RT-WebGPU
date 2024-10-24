import ArrayEncoder from "../helpers/array-encoder";
import RandomHelper from "../helpers/random-helper";
import Hittable from "../interfaces/hittable";
import Serializable from "../interfaces/serializable";
import AABB from "./aabb";
import BVHNode from "./bvh-node";

export default class BVH implements Serializable {
    nodes: BVHNode[] = [];
    
    constructor(
        objects: Hittable[],
    ) {
        this.build(objects, 0, objects.length);
    }

    private build(objects: Hittable[], start: number, end: number): number {
        const objectSpan = end - start;

        if (objectSpan === 1) {
            const leafNode = new BVHNode(objects[start].bbox);
            leafNode.objectIndex = start;
            this.nodes.push(leafNode);
            return this.nodes.length - 1;
        }

        let bbox = AABB.EMPTY;
        for (let i = start; i < end; i++) {
            bbox = new AABB({
                boxes: {
                    box0: bbox,
                    box1: objects[i].bbox,
                }
            });
        }

        const axis = bbox.longestAxis();

        const comparator = 
            axis === 0 ? BVH.boxXcompare :
            axis === 1 ? BVH.boxYcompare : BVH.boxZcompare;

        const sortedPart = objects.slice(start, end).sort(comparator);

        objects.splice(start, objectSpan, ...sortedPart);

        const mid = start + Math.floor(objectSpan / 2);

        const leftIndex = this.build(objects, start, mid);
        const rightIndex = this.build(objects, mid, end);

        const leftNode = this.nodes[leftIndex];
        const rightNode = this.nodes[rightIndex];

        const internalNode = new BVHNode(bbox);
        internalNode.left = leftIndex;
        internalNode.right = rightIndex;

        this.nodes.push(internalNode);

        return this.nodes.length - 1;
    }

    static boxCompare(a: Hittable, b: Hittable, axisIndex: number): number {
        const aAxisInterval = a.bbox.axisInterval(axisIndex);
        const bAxisInterval = b.bbox.axisInterval(axisIndex);
        return bAxisInterval.min - aAxisInterval.min;
    }

    static boxXcompare(a: Hittable, b: Hittable): number {
        return BVH.boxCompare(a, b, 0);
    }

    static boxYcompare(a: Hittable, b: Hittable): number {
        return BVH.boxCompare(a, b, 1);
    }

    static boxZcompare(a: Hittable, b: Hittable): number {
        return BVH.boxCompare(a, b, 2);
    }

    /**
     * 
     * @returns {Float32Array}
     */
    encode(): Float32Array {
        return ArrayEncoder.encode(this.nodes, BVHNode.SIZE);
    }
}
