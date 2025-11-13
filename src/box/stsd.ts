import { logger } from '../util.ts';
import { Box, FullBox } from './box.ts';
// eslint-disable-next-line import-x/no-cycle
import { getBoxes, writeBoxes } from './container.ts';

export class SampleDescriptionBox extends FullBox {
	public sampleCount: number;
	public boxes: Box[] = [];

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.sampleCount = this.raw.readUInt32BE(this.position.inc(4));
		getBoxes(this.raw.subarray(this.position.get()), startPosition + this.position.get(), this.boxes);
		if (this.sampleCount !== this.boxes.length) {
			logger.warn(`sample count mismatch (expect: ${this.sampleCount}, got: ${this.boxes.length})`);
		}
	}

	toBuffer() {
		const body = Buffer.alloc(4);
		body.writeUInt32BE(this.sampleCount);
		const data = Buffer.concat([ this.headerToBuffer(), body, writeBoxes(this.boxes) ]);
		data.writeUInt32BE(data.byteLength);
		return data;
	}
}
