import { compose, Transform } from 'node:stream';
import type { TransformCallback, TransformOptions } from 'node:stream';
// import { ctr } from '@noble/ciphers/aes.js';
import { ctr } from '@noble/ciphers/webcrypto.js';
import type { FileTypeBox } from './box/ftyp.ts';
import type { MovieFragmentBox } from './box/moof.ts';
import type { MovieBox } from './box/moov.ts';
import type { ProtectionSystemSpecificHeaderBox } from './box/pssh.ts';
import type { ProtectionSchemeInfoBox } from './box/sinf.ts';
import { TrackFragmentHeaderBoxFlags } from './box/tfhd.ts';
import type { TrackExtendsBox } from './box/trex.ts';
import { coerceBox, findBoxes, getBox, parseBox } from './parser.ts';
import { counter, logger } from './util.ts';
import type { Sample } from './util.ts';
// import { createDecipheriv } from 'node:crypto';

export class SplitBox extends Transform {
	private buffer?: Buffer;
	private bytesSeen = 0;

	_transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
		let buf: Buffer = this.buffer ? Buffer.concat([ this.buffer, chunk ]) : chunk;
		this.buffer = undefined;

		this.bytesSeen += chunk.byteLength;

		while (true) {
			if (buf.byteLength === 0) return callback();
			const result = getBox(buf, true);

			if (!result) {
				if (buf.length > 0) {
					this.buffer = buf;
				}
				return callback();
			}

			const { box, remaining } = result;
			this.push(box);

			// if (remaining.byteLength === 0) return callback();

			buf = remaining;
		}
	}
};

interface DecryptTrackInfo {
	trackId: number;
	sinf?: ProtectionSchemeInfoBox;
	trex?: TrackExtendsBox;
}

interface DecryptInit {
	psshs: ProtectionSystemSpecificHeaderBox[];
	trackInfos: DecryptTrackInfo[];
}

export class DecryptStream extends Transform {
	private bytesProcessed = 0;
	private initSegment: {
		ftyp?: FileTypeBox;
		moov?: MovieBox;
	} = {};

	private decryptInit: DecryptInit = {
		psshs: [],
		trackInfos: []
	};

	private prevMoof?: MovieFragmentBox;

	private decryptionKey: Buffer;

	constructor(decryptionKey: string, opts?: TransformOptions) {
		super(opts);
		this.decryptionKey = Buffer.from(decryptionKey, 'hex');
	}

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	async _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): Promise<void> {
	// _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
		const box = parseBox(chunk, this.bytesProcessed);

		if (box.type === 'ftyp') {
			if (this.initSegment.ftyp) throw new Error('UNREACHABLE: encountered ftyp box twice');
			this.initSegment.ftyp = coerceBox(box, 'ftyp');
		}

		if (box.type === 'moov') {
			if (this.initSegment.moov) throw new Error('UNREACHABLE: encountered moov box twice');
			this.initSegment.moov = coerceBox(box, 'moov');

			const moov = coerceBox(box, 'moov');

			const traks = findBoxes(moov.boxes, 'trak');
			if (traks.length === 0) throw new Error('UNREACHABLE: no traks in moov');

			for (const trak of traks) {
				// TODO: make the interface less horrible lmao
				const tkhd = findBoxes(trak.boxes, 'tkhd')[0];
				if (!tkhd) throw new Error('UNREACHABLE: no tkhd in trak');
				const mdia = findBoxes(trak.boxes, 'mdia')[0];
				if (!mdia) throw new Error('UNREACHABLE: no mdia in trak');
				const minf = findBoxes(mdia.boxes, 'minf')[0];
				if (!minf) throw new Error('UNREACHABLE: no minf in trak');
				const stbl = findBoxes(minf.boxes, 'stbl')[0];
				if (!stbl) throw new Error('UNREACHABLE: no minf in trak');
				const stsd = findBoxes(stbl.boxes, 'stsd')[0];
				if (!stsd) throw new Error('UNREACHABLE: no minf in trak');

				const trackId = tkhd.trackId;

				let schemeType: string | undefined;

				for (let b of stsd.boxes) {
					let sinf: ProtectionSchemeInfoBox | undefined;

					if (b.type === 'enca') {
						const box = coerceBox(b, 'enca');

						sinf = findBoxes(box.boxes, 'sinf')[0];
						if (!sinf) throw new Error('UNREACHABLE: no sinf in enca');

						// remove sinf box
						box.boxes = box.boxes.filter(i => i.type !== 'sinf');

						const frma = findBoxes(sinf.boxes, 'frma')[0];
						if (!frma) throw new Error('UNREACHABLE: no frma in sinf');

						box.type = frma.dataFormat;

						const schm = findBoxes(sinf.boxes, 'schm')[0];
						if (!schm) throw new Error('UNREACHABLE: no schm in sinf');

						schemeType = schm.schemeType;

						b = box;
					}

					this.decryptInit.trackInfos.push({ trackId, sinf });
				}

				if (schemeType && (schemeType !== 'cenc')) throw new Error(`scheme type ${schemeType} not supported`);

				// unencrypted track
				if (!schemeType) this.decryptInit.trackInfos.push({ trackId });
			}

			const mvex = findBoxes(moov.boxes, 'mvex')[0];
			if (!mvex) throw new Error('UNREACHABLE: no mvex in moov');
			const trexs = findBoxes(mvex.boxes, 'trex');

			for (const trex of trexs) {
				for (const trackInit of this.decryptInit.trackInfos) {
					if (trackInit.trackId === trex.trackId) {
						trackInit.trex = trex;
					}
				}
			}

			const psshs = findBoxes(moov.boxes, 'pssh');
			if (!psshs) throw new Error('UNREACHABLE: no pssh in moov');

			// remove pssh box
			moov.boxes = moov.boxes.filter(i => i.type !== 'pssh');

			this.decryptInit.psshs.push(...psshs);

			this.push(moov.toBuffer());
			return callback();
		}

		// get rid of it
		if (box.type === 'sidx') {
			return callback();
		}

		if (box.type === 'moof') {
			if (this.prevMoof) throw new Error('UNREACHABLE: got moof before previous fragment processed');
			this.prevMoof = coerceBox(box, 'moof');
			return callback();
		}

		if (box.type === 'mdat') {
			if (!this.prevMoof) throw new Error('UNREACHABLE: no moof before mdat');

			const mfhd = findBoxes(this.prevMoof.boxes, 'mfhd')[0];
			if (!mfhd) throw new Error('UNREACHABLE: no mfhd in moof');

			const trafs = findBoxes(this.prevMoof.boxes, 'traf');

			for (const traf of trafs) {
				const tfhd = findBoxes(traf.boxes, 'tfhd')[0];
				if (!tfhd) throw new Error('UNREACHABLE: no tfhd in traf');
				logger.debug(`process fragment ${mfhd.sequenceNumber} in track ${tfhd.trackId}`);

				const trackInfo = this.decryptInit.trackInfos.find(({ trackId }) => tfhd.trackId === trackId);
				if (trackInfo?.sinf) {
					const schm = findBoxes(trackInfo.sinf.boxes, 'schm')[0];
					if (!schm) throw new Error('UNREACHABLE: impossible condition');
					if (schm.schemeType !== 'cenc') throw new Error('UNREACHABLE: impossible condition');
					const schi = findBoxes(trackInfo.sinf.boxes, 'schi')[0];
					if (!schi) throw new Error('UNREACHABLE: impossible condition');
					const tenc = findBoxes(schi.boxes, 'tenc')[0];
					if (!tenc) throw new Error('UNREACHABLE: impossible condition');
					const senc = findBoxes(traf.boxes, 'senc')[0];
					if (!senc) {
						logger.debug(`no senc in traf for fragment ${mfhd.sequenceNumber} in track ${tfhd.trackId}, assume unencrypted`);
						break;
					}
					senc.parseReadBox(tenc.defaultPerSampleIVSize);

					const saioSize = traf.boxes.find(b => b.type === 'saio')?.size ?? 0;
					const saizSize = traf.boxes.find(b => b.type === 'saiz')?.size ?? 0;

					// remove senc box
					traf.boxes = traf.boxes.filter(i => i.type !== 'senc');
					// remove saio box
					traf.boxes = traf.boxes.filter(i => i.type !== 'saio');
					// remove saiz box
					traf.boxes = traf.boxes.filter(i => i.type !== 'saiz');

					const removedBytes = senc.size + saioSize + saizSize;

					const samples: Array<Sample & { iv: Buffer; offset: number; size: number }> = [];
					const truns = findBoxes(traf.boxes, 'trun');

					// let mdatHeaderSkipped = false;
					for (const trun of truns) {
						let baseOffset = 0;
						if (tfhd.baseDataOffset) {
							baseOffset = Number(tfhd.baseDataOffset); // yolo
						} else if (tfhd.flags.has(TrackFragmentHeaderBoxFlags.DEFAULT_BASE_IS_MOOF)) {
							baseOffset = 0;
						}
						if (trun.dataOffset) {
							baseOffset += trun.dataOffset - this.prevMoof.raw.byteLength;
							trun.dataOffset -= removedBytes;
							// lazy
							trun.raw.writeInt32BE(trun.dataOffset, 12 + 4);
						}

						const mdatOffset = counter(baseOffset);
						const sampleCount = trun.sampleCount;

						if (trun.samples.length !== senc.initializationVectors.length)
							throw new Error(`different number of trun samples (${trun.samples.length}) and senc ivs (${senc.initializationVectors.length})`);

						for (let i = 0; i < sampleCount; i++) {
							const sampleSize = tfhd.defaultSampleSize ?? trun.samples[i].size;
							if (!sampleSize) throw new Error('UNREACHABLE: no default sample size in tfhd and no sample size in trun');
							const pos = mdatOffset.inc(sampleSize);

							samples.push({
								...trun.samples[i],
								iv: senc.initializationVectors[i],
								offset: pos,
								size: sampleSize
							});
						}
					}

					const samplesSize = samples.map(({ size }) => size).reduce((prev, cur) => prev + cur);
					const mdatBoxOffset = samples[0].offset;

					if (samplesSize !== (box.raw.byteLength - mdatBoxOffset)) throw new Error('UNREACHABLE: size mismatch');

					for (const sample of samples) {
						const iv = Buffer.alloc(16);
						iv.set(sample.iv);

						const decipher = ctr(this.decryptionKey, iv);
						const decrypted = await decipher.decrypt(box.raw.subarray(sample.offset, sample.offset + sample.size));

						// js impl slow
						// const decipher = ctr(this.decryptionKey, iv);
						// const decrypted = decipher.decrypt(box.raw.subarray(sample.offset, sample.offset + sample.size));

						// depends on openssl, unreliable
						// const decipher = createDecipheriv('aes-128-ctr', this.decryptionKey, iv);
						// const decrypted = Buffer.concat([
						// 	decipher.update(box.raw.subarray(sample.offset, sample.offset + sample.size)),
						// 	decipher.final()
						// ]);

						if (decrypted.byteLength !== sample.size) throw new Error('UNREACHABLE: impossible condition');
						if (sample.offset > box.raw.byteLength) throw new Error('UNREACHABLE: impossible condition');
						box.raw.set(decrypted.subarray(0, sample.size), sample.offset);
					}
				}
			}

			this.push(this.prevMoof.toBuffer());
			this.prevMoof = undefined;
			// write length
			box.raw.writeUInt32BE(box.raw.byteLength);
			this.push(box.raw);
			return callback();
		}

		this.bytesProcessed += chunk.byteLength;
		this.push(box.toBuffer());
		callback();
	}
};

export function createDecryptStream(key: string) {
	return compose(new SplitBox(), new DecryptStream(key));
}
