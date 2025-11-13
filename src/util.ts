import type { Stream } from 'node:stream';
import { Logger } from '@shipgirl/logger';

export const logger = new Logger({ module: 'MP4' });

export function readUInt24BE(buffer: Buffer, offset = 0) {
	return (buffer.readUInt16BE(offset) << 8) + buffer.readUInt8(offset + 2);
}

export function writeUInt24BE(buffer: Buffer, value: number, offset = 0) {
	if (value < 0 || value > 0xFFFFFF) {
		throw new Error('Value must be between 0 and 16777215');
	}

	buffer.writeUInt16BE(value >>> 8, offset);
	buffer.writeUInt8(value & 0xFF, offset + 2);
}

export function readString(buffer: Buffer, size: number, offset?: number, encoding?: BufferEncoding) {
	offset ??= 0;
	return buffer.subarray(offset, offset + size).toString(encoding);
}

export function counter(start = 0) {
	let count = start;
	return {
		inc: (amount = 1) => {
			const currentAmount = count;
			count += amount;
			return currentAmount;
		},
		get: () => count
	};
}

export function * chunk(buf: Buffer, maxBytes: number) {
	while (buf.byteLength) {
		if (maxBytes > buf.byteLength) {
			yield buf.subarray(0, buf.byteLength);
			break;
		}
		yield buf.subarray(0, maxBytes);
		buf = buf.subarray(maxBytes);
	}
}

export function bitflag(input: number) {
	return {
		has: (flag: number) => (input & flag) === flag,
		get: () => input
	};
}

export type BitFlag = ReturnType<typeof bitflag>;

export interface Sample {
	flags?: number;
	duration?: number;
	size?: number;
	compositionTimeOffset?: number;
}

// for some reason its not included in @types/node but it exists
// https://nodejs.org/api/stream.html#streamcomposestreams
declare module 'stream' {
	function compose(...args: Stream[]): Duplex;
}
