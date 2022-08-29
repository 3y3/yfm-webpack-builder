import type { LoaderContext } from 'webpack';
import type { Root } from 'mdast';
import type { Include } from '../utils/mdast';
import { remove } from '../utils/unist';
import { header } from '../utils/mdast';
import { loadModuleAst } from '../utils';
import { withQuery } from '../../utils';

export async function resolveContent(ctx: LoaderContext<any>, include: Include) {
    const { path, fragment, notitle } = include;
    const ast = await loadModuleAst<Root>(ctx, withQuery(path, { include: true, fragment }));

    if (notitle) {
        removeTitle(ast);
    }

    return ast;
}

function removeTitle(fragment: Root) {
    remove(header(fragment), fragment);
}