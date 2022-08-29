import type { Root } from 'mdast';
import { visit, select } from './utils/unist';
import { asyncAstLoader } from './utils';
import { Anchor } from './utils/mdast';
import { Text } from 'mdast';

export default asyncAstLoader<{}, Root>(async function({ ast, meta }) {
    const refs: Record<string, string> = {};

    visit<Anchor>(ast, 'heading-anchor', (node, _index, parent) => {
        const text = select<Text>('text', parent) as Text;
        refs[node.value] = text.value;
    });

    meta.refs = Object.assign(meta.refs || {}, refs);
}, 'meta.refs');