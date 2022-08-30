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
    processed.add(this.resourcePath);

    const defs = definitions(ast);

    const assets = (selectAll('link, image', ast) as (Link | Image)[])
        .reduce((acc, node) => {
            const url = toLocalLink(defs(node.url)?.url || node.url, this.context, this.rootContext);

            if (url) {
                node.url = url;
                acc.push(node);
            }

            return acc;
        }, [] as (Image | Link)[]);

    await Promise.all(assets.map((node) => handleAsset(this, node.url)));
}, 'handle-assets');