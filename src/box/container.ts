// eslint-disable-next-line import-x/no-cycle
import { getBox, parseBox } from '../parser.ts';
import { Box, FullBox } from './box.ts';

export class ContainerBox extends Box {
	public boxes: Box[] = [];

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		getBoxes(this.raw.subarray(this.position.get()), startPosition + this.position.get(), this.boxes);
	}

	toBuffer() {
		const data = Buffer.concat([ this.headerToBuffer(), writeBoxes(this.boxes) ]);
		data.writeUInt32BE(data.byteLength);
		return data;
	}
}

export class ContainerFullBox extends FullBox {
	public boxes: Box[] = [];

	constructor(data: Buffer, startPosition: number) {
		super(data, startPosition);

		getBoxes(this.raw.subarray(this.position.get()), startPosition + this.position.get(), this.boxes);
	}

	toBuffer() {
		const data = Buffer.concat([ this.headerToBuffer(), writeBoxes(this.boxes) ]);
		data.writeUInt32BE(data.byteLength);
		return data;
	}
}

export function getBoxes(data: Buffer, startPosition: number, boxes: Box[]) {
	const result = getBox(data);
	if (!result) throw new Error('UNREACHABLE: could not get box in container, logic bug or malformed data');
	const { box, remaining } = result;

	const parsed = parseBox(box, startPosition);
	if (parsed) boxes.push(parsed);

	const newStartPosition = startPosition + data.byteLength - remaining.byteLength;

	if (remaining.byteLength > 0) getBoxes(remaining, newStartPosition, boxes);
}

export function writeBoxes(boxes: Box[]) {
	return Buffer.concat(boxes.map(b => b.toBuffer()));
}
