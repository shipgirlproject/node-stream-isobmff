import { readString } from '../util.ts';
import { FullBox } from './box.ts';

export class TrackEncryptionBox extends FullBox {
	public defaultIsProtected: boolean;
	public defaultPerSampleIVSize: number;
	public defaultKID: string;
	public defaultConstantIV?: Buffer;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.position.inc(2); // reserved
		this.defaultIsProtected = Boolean(this.raw.readUInt8(this.position.inc()));
		this.defaultPerSampleIVSize = this.raw.readUInt8(this.position.inc());
		this.defaultKID = readString(this.raw, 16, this.position.inc(16), 'hex');
		if (this.defaultIsProtected && (this.defaultPerSampleIVSize === 0)) {
			const defaultConstantIVSize = this.raw.readUInt8(this.position.inc(1));
			this.defaultConstantIV = this.raw.subarray(this.position.inc(defaultConstantIVSize), this.position.get() + defaultConstantIVSize);
		}
	}
}
