export default interface BVHStackEntry {
    start: number;
    end: number;
    parentIndex: number | null;
    isLeftChild: boolean;
}
