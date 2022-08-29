import type { Root } from 'mdast';
import type { Include } from '../utils/mdast';
import { selectAll, visit, SKIP } from '../utils/unist';
import { asyncAstLoader } from '../utils';
import { resolveContent } from './utils';

export default asyncAstLoader(async function({ ast }) {
    const includes: Include[] = selectAll('include', ast);
    const contents: Map<Include, Root> = new Map();

    await Promise.all(includes.map(async (include) => {
        contents.set(include, await resolveContent(this, include));
    }));

    visit<Include>(ast, 'include', (node, index, parent) => {
        const content = contents.get(node);

        if (!content || !parent) {
            console.log('SKIPPED INCLUDE', node);
            return;
        }

        parent.children.splice(index, 1, ...content.children);

        return [ SKIP, index + content.children.length - 1 ];
    });
}, 'merge-includes');
