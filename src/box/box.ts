import type { KnownBoxes } from '../parser.ts';
import { bitflag, counter, logger, readString, readUInt24BE, writeUInt24BE  } from '../util.ts';
import type { BitFlag } from '../util.ts';

export class Box {
	public raw: Buffer;
	public size: number;
	// https://stackoverflow.com/a/58550785
	public type: KnownBoxes | (string & { });

	protected position = counter(0);
	protected writePosition = counter(0);

	protected headerSize = 8;

	constructor(data: Buffer, public startPosition: number) {
		this.raw = data;

		this.size = data.readUInt32BE(this.position.inc(4));
		this.type = readString(data, 4, this.position.inc(4));
	}

	protected headerToBuffer() {
		const data = Buffer.alloc(this.headerSize);
		// console.log(this.size)
		data.writeUInt32BE(this.size, this.writePosition.inc(4));
		data.write(this.type, this.writePosition.inc(4));
		return data;
	}

	toBuffer() {
		logger.debug(`serializer for ${this.type} not implemented, returning input buffer`);
		return this.raw;
	}
}

export class FullBox extends Box {
	public version: number;
	public flags: BitFlag;

	protected headerSize = 12;

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		this.version = this.raw.readUInt8(this.position.inc(1));
		if (this.version !== 0) {
			logger.error(`unexpected version in FullBox (got: ${this.version}, expect: 0)`);
		}
		this.flags = bitflag(readUInt24BE(this.raw, this.position.inc(3)));
	}

	protected headerToBuffer() {
		const data = Buffer.alloc(this.headerSize);
		data.writeUInt32BE(this.size, this.writePosition.inc(4));
		data.write(this.type, this.writePosition.inc(4));
		data.writeUInt8(this.version, this.writePosition.inc(1));
		writeUInt24BE(data, this.flags.get(), this.writePosition.inc(3));
		return data;
	}
}

