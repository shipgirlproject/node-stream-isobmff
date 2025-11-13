import { FullBox } from './box.ts';

export class TrackHeaderBox extends FullBox {
	public creationTime: bigint;
	public modificationTime: bigint;
	public trackId: number;
	public duration: bigint;
	public layer: number;
	public alternateGroup: number;
	public volume: number;
	public matrix: number[] = [];
	public width: number;
	public height: number;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.creationTime = this.raw.readBigUInt64BE(this.position.inc(4));
		this.modificationTime = this.raw.readBigUInt64BE(this.position.inc(4));
		this.trackId = this.raw.readUInt32BE(this.position.inc(4));
		this.raw.readUInt32BE(this.position.inc(4)); // reserved
		this.duration = this.raw.readBigUInt64BE(this.position.inc(4));
		this.raw.readUInt32BE(this.position.inc(4)); // reserved
		this.raw.readUInt32BE(this.position.inc(4)); // reserved
		this.layer = this.raw.readUInt16BE(this.position.inc(2));
		this.alternateGroup = this.raw.readUInt16BE(this.position.inc(2));
		this.volume = this.raw.readUInt16BE(this.position.inc(2)); // 16 float bit?
		this.raw.readUInt16BE(this.position.inc(2)); // reserved

		for (let i = 0; i < 9; i++) {
			this.matrix.push(this.raw.readUInt32BE(this.position.inc(4))); // 32 float bit?
		}

		this.width = this.raw.readUInt32BE(this.position.inc(4));
		this.height = this.raw.readUInt32BE(this.position.inc(4));
	}
}
