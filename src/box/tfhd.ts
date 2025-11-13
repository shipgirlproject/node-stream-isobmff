import { FullBox } from './box.ts';

export enum TrackFragmentHeaderBoxFlags {
	BASE_DATA_OFFSET_PRESENT = 0x000001,
	SAMPLE_DESCRIPTION_INDEX_PRESENT = 0x000002,
	DEFAULT_SAMPLE_DURATION_PRESENT = 0x000008,
	DEFAULT_SAMPLE_SIZE_PRESENT = 0x000010,
	DEFAULT_SAMPLE_FLAGS_PRESENT = 0x000020,
	DURATION_IS_EMPTY = 0x010000,
	DEFAULT_BASE_IS_MOOF = 0x020000
}

export class TrackFragmentHeaderBox extends FullBox {
	public trackId: number;
	public baseDataOffset?: bigint;
	public sampleDescriptionIndex?: number;
	public defaultSampleDuration?: number;
	public defaultSampleSize?: number;
	public defaultSampleFlags?: number;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.trackId = this.raw.readUInt32BE(this.position.inc(4));

		if (this.flags.has(TrackFragmentHeaderBoxFlags.BASE_DATA_OFFSET_PRESENT)) {
			this.baseDataOffset = this.raw.readBigUInt64BE(this.position.inc(8));
		}

		if (this.flags.has(TrackFragmentHeaderBoxFlags.SAMPLE_DESCRIPTION_INDEX_PRESENT)) {
			this.sampleDescriptionIndex = this.raw.readUInt32BE(this.position.inc(4));
		}

		if (this.flags.has(TrackFragmentHeaderBoxFlags.DEFAULT_SAMPLE_DURATION_PRESENT)) {
			this.defaultSampleDuration = this.raw.readUInt32BE(this.position.inc(4));
		}

		if (this.flags.has(TrackFragmentHeaderBoxFlags.DEFAULT_SAMPLE_SIZE_PRESENT)) {
			this.defaultSampleSize = this.raw.readUInt32BE(this.position.inc(4));
		}

		if (this.flags.has(TrackFragmentHeaderBoxFlags.DEFAULT_SAMPLE_FLAGS_PRESENT)) {
			this.defaultSampleFlags = this.raw.readUInt32BE(this.position.inc(4));
		}
	}
}
