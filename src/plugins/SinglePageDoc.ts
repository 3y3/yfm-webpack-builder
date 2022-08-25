import type { Compiler } from 'webpack';
import { resolve } from 'path';
import VirtualModulesPlugin from 'webpack-virtual-modules';

export class SinglePageDoc {
    private modules: VirtualModulesPlugin = new VirtualModulesPlugin({
        [resolve(__dirname, '../../docs/toc.js')]: `window.__DATA__ = require('./toc.yaml')`,
        [resolve(__dirname, '../../docs/single-page.js')]: `require('./single-page.md')`,
        [resolve(__dirname, '../../docs/single-page.md')]: ``
    });

    private readonly name: string;

    constructor() {
        this.name = this.constructor.name;
    }

    apply(compiler: Compiler) {
        this.modules.apply(compiler);

        compiler.hooks.compilation.tap(this.name, (_compilation) => {
            this.modules.writeModule(resolve(__dirname, '../../docs/single-page.md'), `
# Single page MD
            `);
        });
    }
}