import { FullBox } from './box.ts';

export class MediaHeaderBox extends FullBox {
	public creationTime: number;
	public modificationTime: number;
	public timescale: number;
	public duration: number;
	public language: string;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.creationTime = this.raw.readUInt32BE(this.position.inc(4));
		this.modificationTime = this.raw.readUInt32BE(this.position.inc(4));
		this.timescale = this.raw.readUInt32BE(this.position.inc(4));
		this.duration = this.raw.readUInt32BE(this.position.inc(4));
		this.language = readLanguage(this.raw.readUInt16BE(this.position.inc(2)));
	}
}

// https://github.com/Eyevinn/mp4ff/blob/d70788d2dec9cf1e112b4d62d1ae007103dc45ff/mp4/mdhd.go#L66
function readLanguage(raw: number) {
	const offset = 0x60;
	const a = ((raw >> 10) & 0x1f) + offset;
	const b = ((raw >> 5) & 0x1f) + offset;
	const c = (raw & 0x1f) + offset;
	return Buffer.from([ a, b, c ]).toString();
}
