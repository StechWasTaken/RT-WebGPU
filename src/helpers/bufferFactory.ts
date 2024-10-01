type BufferInfo = {
    data: Array<number>,
    offset: number,
}

export default class BufferFactory {
    static prepareForBuffer<T>(input: Array<T>): BufferInfo {
        const output: Array<number> = []
        let offset = 0;
        for (const item of input) {
            
            if (typeof item == 'number') {
                output.push(item);
                offset += 4;
                continue;
            }

            const info = this.prepareForBuffer(Object.values(item));
            offset += info.offset;
            output.push(...info.data);
        }

        return {
            data: output,
            offset: offset,
        }
    }
}