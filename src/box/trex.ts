import { FullBox } from './box.ts';

export class TrackExtendsBox extends FullBox {
	public trackId: number;
	public defaultSampleDescriptionIndex: number;
	public defaultSampleDuration: number;
	public defaultSampleSize: number;
	public defaultSampleFlags: number;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.trackId = this.raw.readUInt32BE(this.position.inc(4));
		this.defaultSampleDescriptionIndex = this.raw.readUInt32BE(this.position.inc(4));
		this.defaultSampleDuration = this.raw.readUInt32BE(this.position.inc(4));
		this.defaultSampleSize = this.raw.readUInt32BE(this.position.inc(4));
		this.defaultSampleFlags = this.raw.readUInt32BE(this.position.inc(4));
	}
}
