import { resolve } from 'path';
import { TocProcessor } from './src/plugins/TocProcessor';
import { PageProcessor } from './src/plugins/PageProcessor';
import { pick } from "lodash";
import { parseQuery } from "./src/utils";
import { Configuration, RuleSetRule } from "webpack";

const options = {
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

const use = (loaders: (boolean | ReturnType<typeof l>)[], type = 'asset/resource') => ({
    type: type,
    use: useful(loaders)
});

const oneOf = (rules: (boolean | RuleSetRule)[]) => ({
    oneOf: useful(rules)
});

const rules = (rules: (boolean | RuleSetRule)[], rest = {}) => ({
    rules: useful(rules),
    ...rest
});

const defaults = use;
const allways = use;

const queried = (modifier: string, loaders: (boolean | ReturnType<typeof l>)[], type = 'json') => ({
    resourceQuery: new RegExp(`[?&]${modifier}=`),
    ...use(loaders, type)
});

const handleBase = function(asset: { filename: string }) {
    const { base = '' } = parseQuery(asset.filename.split('?')[1]);

    return toHtml
        ? `[path]${base}[name].html`
        : `[path][name][ext]`;
};

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
    // cache: false,
    cache: {
        type: 'filesystem',
        compression: false,
        profile: true,
        cacheDirectory: resolve(__dirname, '.temp_cache'),
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
                        rules([
                            oneOf([
                                queried('include', [
                                    l('ast-to-json'),
                                ]),
                                defaults([
                                    toHtml && l('mdast-to-html'),
                                    toMd && l('mdast-to-md'),
                                ])
                            ]),
                            allways([
                                l('md-resolve-link-title'),
                                l('md-handle-assets'),
                                l('md-includes/merge'),
                                l('md-heading-anchors/generate', o(['supportGithubAnchors'])),
                            ])
                        ], {
                            generator: {
                                filename: handleBase
                            }
                        }),
                    ]),
                    queried('fragment', [
                        l('md-extract-fragment'),
                    ]),
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
                    oneOf([
                        queried('include', [
                            l('ast-to-json'),
                        ]),
                        defaults([
                            toHtml && l('toc-to-js'),
                            toMd && l('toc-to-yaml'),
                        ], toHtml ? 'javascript/auto' : 'asset/resource')
                    ]),
                    use([
                        toHtml && l('toc-normalize-hrefs'),
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
