import type { Configuration } from "webpack";
import { resolve } from 'path';
import { TocProcessor } from './src/plugins/TocProcessor';
import { PageProcessor } from './src/plugins/PageProcessor';
import { parseQuery, loader, options, use, defaults, queried, allways, rules, oneOf, useful } from "./src/utils";

const __options = {
    input: './docs',
    outputFormat: 'md',
    ignoreStage: 'test',
    applyPresets: true,
    removeHiddenItems: false,
    supportGithubAnchors: true,
    vars: {
        // lang: 'be'
    }
};

const l = loader(__dirname, 'src/loaders');
const o = options(__options);

const toHtml = __options.outputFormat === 'html';
const toMd = __options.outputFormat === 'md';
const removeHiddenItems = __options.removeHiddenItems;
const applyPresets = true || __options.outputFormat !== 'md' || __options.applyPresets;

const handleBase = function(asset: { filename: string }) {
    const { base = '' } = parseQuery(asset.filename.split('?')[1]);

    return toHtml
        ? `[path]${base}[name].html`
        : `[path][name][ext]`;
};

export default {
    mode: 'production',
    context: resolve(process.cwd(), __options.input),
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
    // cache: false,
    cache: {
        type: 'filesystem',
        compression: false,
        profile: true,
        cacheDirectory: resolve(__dirname, '.cache'),
    },
    module: {
        rules: [
            {
                test: /\.md$/,
                rules: [
                    oneOf([
                        queried('info', [
                            l('meta-to-json'),
                        ]),
                        // or
                        rules([
                            oneOf([
                                queried('include', [
                                    l('ast-to-json'),
                                ]),
                                // or
                                defaults([
                                    toHtml && l('mdast-to-html'),
                                    toMd && l('mdast-to-md'),
                                ])
                            ]),
                            allways([
                                l('md-includes/merge'),
                                l('md-resolve-link-title'),
                                l('md-handle-assets'),
                                l('md-heading-anchors/generate', o(['supportGithubAnchors'])),
                            ])
                        ], {
                            generator: {
                                filename: handleBase
                            }
                        }),
                    ]),
                    // and
                    queried('fragment', [
                        l('md-extract-fragment'),
                    ]),
                    // first
                    allways([
                        l('md-info-title'),
                        l('md-info-refs'),
                        l('md-info-meta'),
                        l('md-includes/parse'),
                        l('md-heading-anchors/parse'),
                        l('md-ast'),
                        l('mdast-frontmatter'),
                        // l('mdast-image-size'),
                        applyPresets && l('liquid-loader', {
                            conditions: false,
                            substitutions: true,
                        })
                    ]),
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
                exclude: [
                    /presets\.yaml$/,
                ],
                rules: [
                    // then
                    oneOf([
                        queried('include', [
                            l('ast-to-json'),
                        ]),
                        // or
                        defaults([
                            toHtml && l('toc-to-js'),
                            toMd && l('toc-to-yaml'),
                        ], toHtml ? 'javascript/auto' : 'asset/resource')
                    ]),
                    // first
                    use([
                        l('toc-merge-includes'),
                        toHtml && l('toc-normalize-hrefs'),
                        toMd && l('toc-resolve-hrefs'),
                        l('toc-resolve-conditions'),
                        removeHiddenItems && l('toc-drop-hidden-items'),
                        l('toc-ast'),
                        applyPresets && l('liquid-loader', {
                            conditions: false,
                            substitutions: true,
                        })
                    ])
                ],

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
