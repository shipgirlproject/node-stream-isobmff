// @ts-check
import { defineConfig } from 'tsdown';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
	entry: [ 'src/index.ts' ],
	format: [ 'esm', 'cjs' ],
	platform: 'node',
	splitting: false,
	sourcemap: true,
	dts: true,
	clean: true,
	shims: true,
	outExtension({ format }) {
		if (format === 'cjs') return {
			js: '.cjs'
		};
		if (format === 'esm') return {
			js: '.mjs'
		};
		return {
			js: '.js'
		};
	}
});
