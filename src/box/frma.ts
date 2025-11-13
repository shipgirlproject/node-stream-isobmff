import { readString } from '../util.ts';
import { Box } from './box.ts';

export class OriginalFormatBox extends Box {
	public dataFormat: string;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.dataFormat = readString(this.raw, 4, this.position.inc(4));
	}
}
