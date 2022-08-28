import { resolve } from 'path';
import { TocProcessor } from './src/plugins/TocProcessor';
import { PageProcessor } from './src/plugins/PageProcessor';
import { pick } from "lodash";
import { parseQuery } from "./src/utils";
import { Configuration } from "webpack";

const options = {
    input: '../docs',
    outputFormat: 'md',
    ignoreStage: 'test',
    applyPresets: true,
    removeHiddenItems: false,
    supportGithubAnchors: true,
    vars: {
        // lang: 'be'
    }
};

const toHtml = options.outputFormat === 'html';
const toMd = options.outputFormat === 'md';
const removeHiddenItems = options.removeHiddenItems;
const applyPresets = true || options.outputFormat !== 'md' || options.applyPresets;

const useful = <T>(array: (T | boolean)[]): T[] => array.filter(Boolean) as T[];

const l = (loader: string, options?: Record<string, any>) => ({
    loader: resolve(__dirname, 'src/loaders', loader),
    options: options || {}
});

const o = (props: string[]) => pick(options, props);

export default {
    mode: 'production',
    context: resolve(process.cwd(), options.input),
    entry: {},
    output: {
        assetModuleFilename: function(_path) {
            // console.log(path);

            return '[path][name][ext]';
        }
    },
    plugins: [
        new PageProcessor(),
        new TocProcessor()
    ],
    resolveLoader: {
        extensions: [ '.ts', '.js', '.json' ]
    },
    cache: false,
    // cache: {
    //     type: 'filesystem',
    //     compression: false,
    //     profile: true,
    //     cacheDirectory: resolve(__dirname, '.temp_cache'),
    // },
    module: {
        rules: [
            {
                test: /\.md$/,
                enforce: 'pre',
                use: useful([
                    l('md-ast'),
                    l('mdast-image-size'),
                    applyPresets && l('liquid-loader', {
                        conditions: false,
                        substitutions: true,
                    })
                ])
            },
            {
                test: /\.md$/,
                type: 'asset/resource',
                oneOf: [
                    {
                        resourceQuery: /info/,
                        use: l('md-info-title'),
                    },
                    {
                        use: useful([
                            toHtml && l('md-to-html'),
                            toMd && l('md-to-md'),
                            l('md-resolve-link-title'),
                            l('md-handle-assets'),
                            l('md-merge-includes'),
                            l('md-resolve-heading-anchor', o(['supportGithubAnchors'])),
                            l('md-info-title')
                        ]),
                        generator: {
                            filename: function(asset: { filename: string }) {
                                const { base = '' } = parseQuery(asset.filename.split('?')[1]);

                                return toHtml
                                    ? `[path]${base}[name].html`
                                    : `[path][name][ext]`;
                            }
                        }
                    }
                ]
            },
            // {
            //     test: /index\.yaml$/,
            //     use: [
            //         l('leading-loader'),
            //         l('yaml-loader'),
            //     ]
            // },
            {
                test: /presets\.yaml$/,
                type: 'asset/resource',
                use: useful([
                    l('vars-loader'),
                    l('presets-loader', o([ 'vars' ])),
                    l('yaml-loader')
                ])
            },
            {
                test: /\.yaml$/,
                type: toHtml ? 'javascript/auto' : 'asset/resource',
                exclude: [
                    /presets\.yaml$/,
                ],
                // type: 'asset/resource',
                use: useful([
                    toHtml && l('toc-to-js'),
                    toHtml && l('toc-normalize-hrefs'),
                    toMd && l('toc-to-yaml'),
                    l('toc-merge-includes'),
                    toMd && l('toc-resolve-hrefs'),
                    l('toc-resolve-conditions'),
                    removeHiddenItems && l('toc-drop-hidden-items'),
                    l('toc-ast'),
                    applyPresets && l('liquid-loader', {
                        conditions: false,
                        substitutions: true,
                    })
                ])


                // use: useful([
                //     l('toc-loader', o([ 'ignoreStage' ])),
                //     l('yaml-loader'),
                //     applyPresets && l('liquid-loader', {
                //         conditions: false,
                //         substitutions: true,
                //     })
                // ])
            },
            {
                test: /\.(jpe?g|png|webp|gif|avif)$/,
                type: 'asset/resource'
            }
        ]
    }
} as Configuration;
