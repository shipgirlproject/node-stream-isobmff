import { readString } from '../util.ts';
import { FullBox } from './box.ts';

export class SchemeTypeBox extends FullBox {
	public schemeType: string;
	public schemeVersion: number;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.schemeType = readString(this.raw, 4, this.position.inc(4));
		this.schemeVersion = this.raw.readUInt32BE(this.position.inc(4));
	}
}
