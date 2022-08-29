import type { Root, Text } from 'mdast';
import type { Include } from './utils/mdast';
import { select } from './utils/unist';
import { title } from './utils/mdast';
import { asyncAstLoader, loadModuleJson } from './utils';
import { parseQuery, withQuery } from '../utils';

const Initial = Symbol('Initial');

export default asyncAstLoader<{}, Root>(async function({ ast, meta }) {
    const { include, info } = parseQuery(this.resourceQuery);
    const node = select<Text>('text', title(ast));

    let value: string | symbol = Initial;

    if (node) {
        value = node.value;
    } else {
        const include = select<Include>(':root > include:first-child', ast);

        // There is no H1 in fragment
        if (include && !include.fragment) {
            const info = await loadModuleJson(this, withQuery(include.path, { info: true }));

            value = info.title;
        }
    }

    if (!value && !include && !info) {
        this.emitWarning(new Error('Missing document title for ' + this.resourcePath));
    } else if (value !== Initial) {
        meta.title = value;
    }
}, 'meta.title');