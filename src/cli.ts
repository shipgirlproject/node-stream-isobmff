import { createReadStream, createWriteStream } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { Logger } from '@shipgirl/logger';
import { createDecryptStream } from './index.ts';

const logger = new Logger({ module: 'CLI' });

function main() {
	const options = getArgs();
	logger.debug(`options: ${JSON.stringify(options)}`);
	const { key, input, output, keepDiscardedBoxes, debugMode } = options!;

	const inFile = createReadStream(input);
	inFile.on('error', (e) => {
		logger.exception(e.message);
	});

	const outFile = createWriteStream(output);
	outFile.on('error', (e) => {
		logger.exception(e.message);
	});

	inFile
		.pipe(createDecryptStream({ key, keepDiscardedBoxes, debugMode }))
		.pipe(outFile);
}

function getArgs() {
	try {
		if (process.argv.length === 2) {
			logger.info(helpText);
			return process.exit(0);
		}

		const { values: { key, help, keepDiscardedBoxes, debug }, positionals } = parseArgs({
			options: {
				key: {
					type: 'string',
					short: 'k'
				},
				help: {
					type: 'boolean',
					short: 'h'
				},
				keepDiscardedBoxes: {
					type: 'boolean'
				},
				debug: {
					type: 'boolean'
				}
			},
			allowPositionals: true
		});

		logger.setDebugMode(debug ?? false);

		if (help) {
			logger.info(helpText);
			return process.exit(0);
		}

		if (!key) {
			return logger.exception('requried argument "key" missing');
		}

		if (key.length !== 32 && !(/^0x[0-9a-f]+$/i.exec(key))) {
			return logger.exception('bad key format, expect 32 character hexadecimal string');
		}

		const input = positionals[0];
		if (!input) {
			return logger.exception('missing input filename');
		}

		const output = positionals[1];
		if (!output) {
			return logger.exception('missing output filename');
		}

		if (pathToFileURL(input).href === pathToFileURL(output).href) {
			return logger.exception('input and output filename cannot be identical');
		}

		return { key, input, output, keepDiscardedBoxes, debugMode: debug };
	} catch (e) {
		const error = e as Error;
		logger.exception(error.message);
	}
}

const helpText = `
usage: decrypt [flags] <input> <output>

Flags:
  -k, --key <value>       32 character hexadecimal decryption key
  -h, --help              display this help text
  --keepDiscardedBoxes    turn discarded boxes into "skip" boxes instead of removing them
  --debug                 enable debug logging
`;

main();
