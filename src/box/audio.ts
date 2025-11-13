import { Box } from './box.ts';
// eslint-disable-next-line import-x/no-cycle
import { getBoxes, writeBoxes } from './container.ts';

export class AudioSampleEntryBox extends Box {
	public dataReferenceIndex: number;
	public channelCount: number;
	public sampleSize: number;
	public sampleRate: number;
	public boxes: Box[] = [];

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.position.inc(6); // reserved
		this.dataReferenceIndex = this.raw.readUInt16BE(this.position.inc(2));
		this.position.inc(8); // reserved
		this.channelCount = this.raw.readUInt16BE(this.position.inc(2));
		this.sampleSize = this.raw.readUInt16BE(this.position.inc(2));
		this.position.inc(4); // reserved
		this.sampleRate = this.raw.readUInt32BE(this.position.inc(4));

		getBoxes(this.raw.subarray(this.position.get()), startPosition + this.position.get(), this.boxes);
	}

	toBuffer() {
		const data = Buffer.concat([ this.headerToBuffer(), Buffer.alloc(28), writeBoxes(this.boxes) ]);
		data.writeUInt32BE(data.byteLength);

		this.writePosition.inc(6); // reserved
		data.writeUInt16BE(this.dataReferenceIndex, this.writePosition.inc(2));
		this.writePosition.inc(8); // reserved
		data.writeUInt16BE(this.channelCount, this.writePosition.inc(2));
		data.writeUInt16BE(this.sampleSize, this.writePosition.inc(2));
		this.writePosition.inc(4); // reserved
		data.writeUInt32BE(this.sampleRate, this.writePosition.inc(4));
		return data;
	}
}
