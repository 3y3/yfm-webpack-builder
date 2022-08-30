import type { Image, Link } from 'mdast';
import type { LoaderContext } from 'webpack';
import { resolve } from 'path';
import { selectAll } from './utils/unist';
import { asyncAstLoader, loadModule, emitFile } from './utils';
import { toLocalLink } from '../utils';
import { definitions } from './utils/mdast';

const processed = new Set();

async function handleAsset(ctx: LoaderContext<any>, path: string) {
    path = resolve(ctx.context, path);

    ctx.addDependency(path);

    if (processed.has(path)) {
        return;
    }

    emitFile(ctx, path, await loadModule(ctx, path));
}

export default asyncAstLoader(async function({ ast }) {
    // Protect circular refs
    // TODO: store in _compilation
    // TODO: write abstract helpers getModule, getCompilation instead of direct access to context._module
    processed.add(this.resourcePath);

    const defs = definitions(ast);

    const assets = (selectAll('link, image', ast) as (Link | Image)[])
        .reduce((acc, node) => {
            const url = toLocalLink(defs(node.url)?.url || node.url, this.context, this.rootContext);

            if (url) {
                node.url = url;
                acc.push(url);
            }

            return acc;
        }, [] as string[]);

    await Promise.all(assets.map((url) => handleAsset(this, url)));
}, 'handle-assets');