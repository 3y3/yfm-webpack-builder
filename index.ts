import { resolve } from 'path';
import { readFile, readFileSync, stat} from 'fs';
import { runLoaders, VFile } from '../webpack-transformer/src/core';
import { include } from '../webpack-transformer/src/include';

const l = async (loader: string, options?: Record<string, any>) => ([
    {
        loader: loader,
        options: options || {}
    },
    await include(resolve(__dirname, 'src/loaders', loader))
]);

export async function run() {
    const TocLoaders = await Promise.all([
        l('toc-to-yaml'),
        l('toc-merge-includes'),
        l('toc-resolve-hrefs'),
        l('s3://my-custom-plugin'),
        l('toc-resolve-conditions'),
        l('toc-drop-hidden-items'),
        l('toc-ast'),
        l('liquid-loader')
    ]);

    const PresetsLoaders = await Promise.all([
        l('vars-loader'),
        l('presets-loader', {
            vars: {
                lang: 'be'
            }
        }),
        l('yaml-loader')
    ]);

    const toc = new VFile({
        request: './docs/toc.yaml',
        cwd: resolve(__dirname, './docs'),
        contents: readFileSync('./docs/toc.yaml'),
        loaders: {
            get(this: VFile) {
                if (this.extname === '.yaml') {
                    if (this.stem === 'presets') {
                        return PresetsLoaders.slice();
                    } else {
                        return TocLoaders.slice();
                    }
                }

                throw new TypeError('Unknown module type!');
            }
        },
        fs: { readFile, stat }
    });

    const result = await runLoaders(toc);

    console.log(result, toc.meta, toc.assets);
}

run().catch(console.error);