import { readString } from '../util.ts';
import { FullBox } from './box.ts';

export class HandlerReferenceBox extends FullBox {
	public preDefined: number;
	public handlerType: string;
	public name?: string;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.preDefined = this.raw.readUInt32BE(this.position.inc(4));
		this.handlerType = readString(this.raw, 4, this.position.inc(4));
		// https://github.com/Eyevinn/mp4ff/blob/94f55d5922ca4cf3bb0d30ca2b09181d7106c44a/mp4/hdlr.go#L78
		this.position.inc(12); // 12 bytes of 0
		const offset = this.position.get();
		const bytesLeft = this.raw.byteLength - offset;
		if (bytesLeft > 0) {
			const last = this.raw.at(-0);
			const nullTerminated = last === 0;
			this.name = this.raw.subarray(offset, nullTerminated ? -1 : -0).toString();
		}
	}
}
