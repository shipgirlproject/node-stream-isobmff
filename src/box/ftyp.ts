import { readString, chunk } from '../util.ts';
import { Box } from './box.ts';

export class FileTypeBox extends Box {
	public majorBrand: string;
	public minorVersion: number;
	public compatibleBrands: string[] = [];

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.majorBrand = readString(this.raw, 4);
		this.minorVersion = this.raw.readUInt32BE(4);
		for (const bytes of chunk(this.raw.subarray(8), 4)) {
			this.compatibleBrands.push(readString(bytes, 4));
		}
	}
}
