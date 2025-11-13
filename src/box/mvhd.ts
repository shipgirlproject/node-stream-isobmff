import { FullBox } from './box.ts';

export class MovieHeaderBox extends FullBox {
	public creationTime: bigint;
	public modificationTime: bigint;
	public timescale: number;
	public duration: bigint;
	public rate: number;
	public volume: number;
	public matrix: number[] = [];
	public nextTrackId: number;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.creationTime = this.raw.readBigUInt64BE(this.position.inc(4));
		this.modificationTime = this.raw.readBigUInt64BE(this.position.inc(4));
		this.timescale = this.raw.readUInt32BE(this.position.inc(4));
		this.duration = this.raw.readBigUInt64BE(this.position.inc(4));
		this.rate = this.raw.readUInt32BE(this.position.inc(4));
		this.volume = this.raw.readUInt16BE(this.position.inc(2));
		this.raw.readUInt16BE(this.position.inc(2)); // reserved
		this.raw.readUInt32BE(this.position.inc(4)); // reserved
		this.raw.readUInt32BE(this.position.inc(4)); // reserved

		for (let i = 0; i < 9; i++) {
			this.matrix.push(this.raw.readUInt32BE(this.position.inc(4)));
		}

		this.raw.readUInt32BE(this.position.inc(4)); // pre_defined
		this.nextTrackId = this.raw.readUInt32BE(this.position.inc(4));
	}
}
