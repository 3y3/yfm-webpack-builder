import type { Root } from 'mdast';
import type { YamlNode } from 'remark-frontmatter';
import { load } from 'js-yaml';
import { visit, SKIP } from './utils/unist';
import { asyncAstLoader } from './utils';

export default asyncAstLoader<{}, Root>(async function({ ast, meta }) {
    const data = {};

    visit<YamlNode>(ast, 'yaml', (node, index, parent) => {
        Object.assign(data, load(node.value));

        if (parent) {
            parent.children.splice(index, 1);
        }

        return [ SKIP, index ];
    });

    meta.meta = data;
}, 'meta.meta');