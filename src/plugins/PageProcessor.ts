import type { Compilation, Compiler } from 'webpack';
import VirtualModulesPlugin from 'webpack-virtual-modules';

const PagePlaceholder = Symbol('Page');

type Callback<T extends any[] = any[]> = (...args: T) => void;

type ExtCompilation = Compilation & {
    [PagePlaceholder]: PageProcessor;
};

export class PageProcessor {

    static from(compilation: ExtCompilation | any): PageProcessor {
        return compilation && compilation[PagePlaceholder] || new PageProcessor();
    }

    static hooks(compiler: Compiler, plugin: string, action: Callback<[ PageProcessor ]>) {
        compiler.hooks.thisCompilation.tap(plugin, (compilation: Compilation) => {
            action(PageProcessor.from(compilation));
        });
    }

    private readonly modules: VirtualModulesPlugin = new VirtualModulesPlugin();

    private readonly name: string;

    constructor() {
        this.name = this.constructor.name;
    }

    apply(compiler: Compiler) {
        this.modules.apply(compiler);

        compiler.hooks.environment.tap(this.name, () => {
            Object.assign(compiler.options.entry, {
                page: { import: [ './page.js' ] }
            });
        });

        compiler.hooks.compilation.tap(this.name, () => {
            this.modules.writeModule('./page.js', `
                window.__DATA__ = window.__DATA__ || {};
                window.__DATA__.toc = require('./toc.yaml');
                window.__PLUGINS__ = require('./plugins.js');
            `);

            this.modules.writeModule('./plugins.js', `
                export default {
                
                };
            `);
        });

        compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
            Object.assign(compilation, {
                [PagePlaceholder]: this
            });
        });
    }
}