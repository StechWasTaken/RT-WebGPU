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
        this.build(objects);
    }

    private build(objects: Hittable[]): void {
        const stack: { start: number, end: number, parentIndex: number | null, isLeftChild: boolean }[] = [];
        stack.push({ start: 0, end: objects.length, parentIndex: null, isLeftChild: false });
    
        while (stack.length > 0) {
            const { start, end, parentIndex, isLeftChild } = stack.pop()!;

            const objectSpan = end - start;
    
            if (objectSpan === 1) {
                const leafNode = new BVHNode(objects[start].bbox);
                
                leafNode.objectIndex = start;

                this.nodes.push(leafNode);

                const currentNodeIndex = this.nodes.length - 1;

                if (parentIndex === null) {
                    continue;
                }
    
                if (isLeftChild) {
                    this.nodes[parentIndex].left = currentNodeIndex;
                } else {
                    this.nodes[parentIndex].right = currentNodeIndex;
                }
    
                continue;
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
            
            for (let i = 0; i < objectSpan; i++) {
                objects[start + i] = sortedPart[i];
            }
    
            const mid = start + Math.floor(objectSpan / 2);
    
            const internalNode = new BVHNode(bbox);
            const currentNodeIndex = this.nodes.length;
            this.nodes.push(internalNode);
    
            if (parentIndex !== null) {
                if (isLeftChild) {
                    this.nodes[parentIndex].left = currentNodeIndex;
                } else {
                    this.nodes[parentIndex].right = currentNodeIndex;
                }
            }
    
            stack.push({ start: mid, end: end, parentIndex: currentNodeIndex, isLeftChild: false });
            stack.push({ start: start, end: mid, parentIndex: currentNodeIndex, isLeftChild: true });
        }
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
