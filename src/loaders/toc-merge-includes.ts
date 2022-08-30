import type { Include, Item } from './utils/tocst';
import type { Parent } from 'unist';
import { pvisit, SKIP, selectAll } from './utils/unist';
import { IncludeMode } from './utils/tocst';
import { asyncAstLoader, loadModuleAst } from './utils';
import { dirname, relative, resolve } from 'path';
import { withQuery } from '../utils';

export default asyncAstLoader(async function({ ast }) {
    const includes: [ Include, Item, Parent | undefined ][] = [];

    pvisit<Include>(ast, 'include', (node, parents) => {
        const item = parents[parents.length - 1] as Item;
        const parent = parents[parents.length - 2] as Item | undefined;

        includes.push([ node, item, parent ]);

        return SKIP;
    });

    await Promise.all(includes.map(async ([ include, item, parent ]) => {
        const base = resolveBase(include, this.context, this.rootContext);
        const module = await loadModuleAst(this, resolvePath(include.path, this.context, base));

        const items = selectAll<Item>(':root > item', module);

        if (item.name) {
            const index = item.children.indexOf(include);
            item.children.splice(index, 1, ...items);
        } else if (parent) {
            const index = parent.children.indexOf(item);
            parent.children.splice(index, 1, ...items);
        } else {
            throw new TypeError('Unresolved tocst condition.');
        }
    }));
});

function resolveBase(include: Include, context: string, root: string) {
    const { path, mode = IncludeMode.ROOT_MERGE } = include;

    let base = '';
    switch (mode) {
        case IncludeMode.ROOT_MERGE:
            base = relative(resolve(root, dirname(path)), root) + '/';
            break;
        case IncludeMode.MERGE:
            base = relative(resolve(context, dirname(path)), context) + '/';
            break;
    }

    return base;
}

function resolvePath(path: string, context: string, base: string) {
    return withQuery(resolve(context, path), { base, include: true });
}