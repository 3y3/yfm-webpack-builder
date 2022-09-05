import { resolve } from 'path';
import { readFile, readFileSync, stat} from 'fs';
import { runLoaders, VFile } from '../yfm-loader-runner/src/core';
import { include } from '../yfm-loader-runner/src/include';
import { options } from './src/utils';

const l = async (loader: string, options?: Record<string, any>) => ([
    {
        loader: loader,
        options: options || {}
    },
    await include(resolve(__dirname, 'src/loaders', loader))
]);

const o = options({
    supportGithubAnchors: true
});

const toMd = true;
// const toHtml = !toMd;

export async function run() {
    const TocLoaders = await Promise.all([
        l('toc-to-yaml'),
        l('toc-merge-includes'),
        l('toc-resolve-hrefs'),
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

    const MdAlwaysLoaders = await Promise.all([
        l('md-info-title'),
        l('md-info-refs'),
        l('md-info-meta'),
        l('md-includes/parse'),
        l('md-heading-anchors/parse'),
        l('md-ast'),
        l('mdast-frontmatter'),
        l('liquid-loader', {
            conditions: false,
            substitutions: true,
        })
    ]);

    const MdFragmentLoaders = await Promise.all([
        l('md-extract-fragment'),
    ]);

    const MdInfoLoaders = await Promise.all([
        l('meta-to-json')
    ]);

    const MdHardLoaders = await Promise.all([
        l('md-includes/merge'),
        l('md-resolve-link-title'),
        // l('md-handle-assets'),
        l('md-heading-anchors/generate', o(['supportGithubAnchors'])),
    ]);

    const MdIncludeLoaders = await Promise.all([
        l('ast-to-json'),
    ]);

    const MdToMdLoaders = await Promise.all([
        l('mdast-to-md'),
    ]);

    const MdToHtmlLoaders = await Promise.all([
        l('mdast-to-html')
    ]);

    const toc = new VFile({
        request: './toc.yaml',
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

                if (this.extname === '.md') {
                    const loaders = [...MdAlwaysLoaders];

                    if (/[?&]fragment=/.test(this.query)) {
                        loaders.unshift(...MdFragmentLoaders);
                    }

                    if (/[?&]info=/.test(this.query)) {
                        loaders.unshift(...MdInfoLoaders);
                        return loaders;
                    } else {
                        loaders.unshift(...MdHardLoaders);

                        if (/[?&]include=/.test(this.query)) {
                            loaders.unshift(...MdIncludeLoaders);
                        } else {
                            loaders.unshift(...(toMd ? MdToMdLoaders : MdToHtmlLoaders))
                        }

                        return loaders;
                    }
                }

                console.log(this, MdHardLoaders);

                throw new TypeError('Unknown module type!');
            }
        },
        fs: { readFile, stat }
    });

    const result = await runLoaders(toc);

    console.log(result, toc.meta, toc.assets);
}

run().catch(console.error);