// @ts-check
import { defineConfig } from 'tsdown';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
	entry: [ 'src/index.ts' ],
	format: [ 'esm', 'cjs' ],
	platform: 'node',
	sourcemap: true,
	dts: true,
	clean: true,
	shims: true,
	outExtensions({ format }) {
		if (format === 'cjs') return {
			js: '.cjs'
		};
		if (format === 'es') return {
			js: '.mjs'
		};
		return {
			js: '.js'
		};
	}
});
