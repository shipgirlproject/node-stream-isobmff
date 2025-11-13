/* eslint-disable import-x/no-cycle */
import { AudioSampleEntryBox } from './box/audio.ts';
import { Box } from './box/box.ts';
import { OriginalFormatBox } from './box/frma.ts';
import { FileTypeBox } from './box/ftyp.ts';
import { HandlerReferenceBox } from './box/hdlr.ts';
import { MediaHeaderBox } from './box/mdhd.ts';
import { MediaBox } from './box/mdia.ts';
import { MetaBox } from './box/meta.ts';
import { MovieFragmentHeaderBox } from './box/mfhd.ts';
import { MediaInfoBox } from './box/minf.ts';
import { MovieFragmentBox } from './box/moof.ts';
import { MovieBox } from './box/moov.ts';
import { MovieExtendsBox } from './box/mvex.ts';
// import { MovieHeaderBox } from './box/mvhd.ts';
import { ProtectionSystemSpecificHeaderBox } from './box/pssh.ts';
import { SchemeInfoBox } from './box/schi.ts';
import { SchemeTypeBox } from './box/schm.ts';
import { SampleEncryptionBox } from './box/senc.ts';
import { ProtectionSchemeInfoBox } from './box/sinf.ts';
import { SampleTableBox } from './box/stbl.ts';
import { SampleDescriptionBox } from './box/stsd.ts';
import { TrackEncryptionBox } from './box/tenc.ts';
import { TrackFragmentHeaderBox } from './box/tfhd.ts';
import { TrackHeaderBox } from './box/tkhd.ts';
import { TrackFragmentBox } from './box/traf.ts';
import { TrackBox } from './box/trak.ts';
import { TrackExtendsBox } from './box/trex.ts';
import { TrackRunBox } from './box/trun.ts';
import { logger, readString } from './util.ts';

export function getBox(chunk: Buffer, root?: boolean) {
	/**
     * Box {
     *     size: u32be
     *     type: u32be
     *     -- rest of data
     * }
     */
	if (chunk.byteLength < 4) return undefined;
	const size = chunk.readUInt32BE();
	if (size > chunk.byteLength) {
		if (!root) return undefined;

		// for some reason the last segment might be 1 off from test case?
		if (size - chunk.byteLength !== 1) return undefined;
		chunk = Buffer.concat([ chunk, Buffer.alloc(1) ]);
	}

	const box = chunk.subarray(0, size);
	const remaining = chunk.subarray(size);
	return { box, remaining };
}

export const knownBoxesMap = {
	ftyp: FileTypeBox,
	moov: MovieBox,
	// mvhd: MovieHeaderBox,
	mvex: MovieExtendsBox,
	trex: TrackExtendsBox,
	meta: MetaBox,
	hdlr: HandlerReferenceBox,
	trak: TrackBox,
	tkhd: TrackHeaderBox,
	mdia: MediaBox,
	mdhd: MediaHeaderBox,
	minf: MediaInfoBox,
	stbl: SampleTableBox,
	stsd: SampleDescriptionBox,
	mp4a: AudioSampleEntryBox,
	enca: AudioSampleEntryBox,
	sinf: ProtectionSchemeInfoBox,
	frma: OriginalFormatBox,
	schm: SchemeTypeBox,
	schi: SchemeInfoBox,
	tenc: TrackEncryptionBox,
	pssh: ProtectionSystemSpecificHeaderBox,
	moof: MovieFragmentBox,
	mfhd: MovieFragmentHeaderBox,
	traf: TrackFragmentBox,
	tfhd: TrackFragmentHeaderBox,
	trun: TrackRunBox,
	senc: SampleEncryptionBox
} as const;

export type KnownBoxesMap = {
	[K in keyof typeof knownBoxesMap]: InstanceType<typeof knownBoxesMap[K]>
};

export type KnownBoxes = keyof KnownBoxesMap;

export function parseBox(chunk: Buffer, startPosition: number) {
	const type = readString(chunk, 4, 4);
	logger.debug(`got type ${type} at position ${startPosition}`);

	if (type in knownBoxesMap) {
		return new knownBoxesMap[type as KnownBoxes](chunk, startPosition);
	}

	logger.debug(`got unknown type ${type} while parsing box, returning generic box`);
	return new Box(chunk, startPosition);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function coerceBox<T extends KnownBoxes>(box: Box, _target: T) {
	return box as KnownBoxesMap[T];
}

export function findBoxes<T extends KnownBoxes>(boxes: Box[], target: T) {
	return boxes.filter(b => b.type === target) as Array<KnownBoxesMap[T]>;
}
