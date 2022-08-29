import type { Include } from './utils/tocst';
import type { Parent } from 'unist';
import { visit, SKIP, selectAll } from './utils/unist';
import { IncludeMode } from './utils/tocst';
import { asyncAstLoader, loadModuleAst } from './utils';
import { dirname, relative, resolve } from 'path';
import { withQuery } from '../utils';

export default asyncAstLoader(async function({ ast }) {
    const includes: [ string, string, Parent ][] = [];

    visit<Include>(ast, 'include', (node, index, parent) => {
        const base = resolveBase(node, this.context, this.rootContext);

        parent?.children.splice(index, 1);
        includes.push([ base, node.path, parent as Parent ]);

        return SKIP;
    });

    await Promise.all(includes.map(async ([ base, path, parent ]) => {
        const module = await loadModuleAst(this, resolvePath(path, this.context, base));

        const items = selectAll(':root > item', module);

        parent.children.push(...items);
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