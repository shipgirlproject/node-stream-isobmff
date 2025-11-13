import { readString } from '../util.ts';
import { FullBox } from './box.ts';

export class ProtectionSystemSpecificHeaderBox extends FullBox {
	public systemId: string;
	public protectionData: Buffer;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.systemId = readString(this.raw, 16, this.position.inc(16), 'hex');
		this.protectionData = this.raw.subarray(this.position.get());
	}
}
