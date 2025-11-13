import type { Sample } from '../util.ts';
import { FullBox } from './box.ts';

export enum TrackRunBoxFlags {
	DATA_OFFSET_PRESENT = 0x01,
	FIRST_SAMPLE_FLAGS_PRESENT = 0x04,
	SAMPLE_DURATION_PRESENT = 0x100,
	SAMPLE_SIZE_PRESENT = 0x200,
	SAMPLE_FLAGS_PRESENT = 0x400,
	SAMPLE_COMPOSITION_TIME_OFFSET_PRESENT = 0x800
}

export class TrackRunBox extends FullBox {
	public sampleCount: number;
	public dataOffset?: number;
	public firstSampleFlags?: number;
	public samples: Sample[] = [];

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.sampleCount = this.raw.readUInt32BE(this.position.inc(4));

		if (this.flags.has(TrackRunBoxFlags.DATA_OFFSET_PRESENT)) {
			this.dataOffset = this.raw.readInt32BE(this.position.inc(4));
		}

		if (this.flags.has(TrackRunBoxFlags.FIRST_SAMPLE_FLAGS_PRESENT)) {
			this.firstSampleFlags = this.raw.readUInt32BE(this.position.inc(4));
		}

		for (let i = 0; i < this.sampleCount; i++) {
			let duration: number | undefined;
			let size: number | undefined;
			let flags: number | undefined;
			let compositionTimeOffset: number | undefined;

			if (this.flags.has(TrackRunBoxFlags.SAMPLE_DURATION_PRESENT)) {
				duration = this.raw.readUInt32BE(this.position.inc(4));
			}

			if (this.flags.has(TrackRunBoxFlags.SAMPLE_SIZE_PRESENT)) {
				size = this.raw.readUInt32BE(this.position.inc(4));
			}

			if (this.flags.has(TrackRunBoxFlags.SAMPLE_FLAGS_PRESENT)) {
				flags = this.raw.readUInt32BE(this.position.inc(4));
			} else if (this.flags.has(TrackRunBoxFlags.FIRST_SAMPLE_FLAGS_PRESENT) && (i === 0)) {
				flags = this.firstSampleFlags;
			}

			if (this.flags.has(TrackRunBoxFlags.SAMPLE_COMPOSITION_TIME_OFFSET_PRESENT)) {
				compositionTimeOffset = this.raw.readInt32BE(this.position.inc(4));
			}

			this.samples.push({ duration, size, flags, compositionTimeOffset });
		}
	}
}
