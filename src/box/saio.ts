import { FullBox } from './box.ts';

export class SampleAuxiliaryInformationOffsetsBox extends FullBox {
	public offset: number;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.offset = Number(this.raw.readBigUInt64BE(this.position.inc(8)));
	}
}
