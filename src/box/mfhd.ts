import { FullBox } from './box.ts';

export class MovieFragmentHeaderBox extends FullBox {
	public sequenceNumber: number;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.sequenceNumber = this.raw.readUInt32BE(this.position.inc(4));
	}
}
