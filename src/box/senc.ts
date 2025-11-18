import { FullBox } from './box.ts';

export enum SampleEncryptionBoxFlags {
	USE_SUBSAMPLE_ENCRYPTION = 0x2
}

export class SampleEncryptionBox extends FullBox {
	public sampleCount: number;
	public initializationVectors: Buffer[] = [];

	private parsed = false;
	private perSampleIVSize?: number;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.sampleCount = this.raw.readUInt32BE(this.position.inc(4));
	}

	// https://github.com/Eyevinn/mp4ff/blob/d70788d2dec9cf1e112b4d62d1ae007103dc45ff/mp4/senc.go#L192
	public parseBox(perSampleIVSize: number) {
		if (this.parsed) throw new Error('Parse SampleEncryptionBox: already parsed');

		if (perSampleIVSize !== 0) this.perSampleIVSize = perSampleIVSize;

		const bytesLeft = this.size - this.position.get();

		if (!this.flags.has(SampleEncryptionBoxFlags.USE_SUBSAMPLE_ENCRYPTION)) {
			if (perSampleIVSize === 0) {
				this.perSampleIVSize = bytesLeft / this.sampleCount;
			}

			// probably useless but it is what mp4ff does??
			if (this.perSampleIVSize === 0) {
				this.parsed = true;
				return;
			}

			if (this.perSampleIVSize === 8 || this.perSampleIVSize === 16) {
				for (let i = 0; i < this.sampleCount; i++) {
					const offset = this.position.inc(this.perSampleIVSize);
					this.initializationVectors.push(this.raw.subarray(offset, offset + this.perSampleIVSize));
				}
				this.parsed = true;
				return;
			}

			throw new Error(`Unexepected perSampleIVSize (expected: 0 or 8 or 16, got: ${perSampleIVSize}, calculated: ${this.perSampleIVSize})`);
		}

		throw new Error('Parse SampleEncryptionBox: subsamples handling not implemented');
	}
}
