import type { Root } from 'mdast';
import { visit, SKIP, select, EXIT } from './utils/unist';
import { asyncAstLoader } from './utils';

import { Node } from 'unist';
import { Heading } from 'mdast';
import { Anchor } from './utils/mdast';
import { parseQuery } from '../utils';

type RangePoint<T extends Node = Node> = {
    index: number;
    node: T;
};

export default asyncAstLoader<{}, Root>(async function({ ast }) {
    const { fragment } = parseQuery(this.resourceQuery);

    let start: RangePoint<Heading> | null = null;
    let end: RangePoint<Node> | null = null;

    visit<Heading>(ast, 'heading', (node, index) => {
        if (!start) {
            const anchor = select<Anchor>(`heading-anchor[value="${fragment}"]`, node);
            if (anchor) {
                start = { node, index };
            }
        } else {
            if (node.depth <= start.node.depth) {
                end = { node, index };

                return EXIT;
            }
        }

        return SKIP;
    });

    end = end || {
        node: ast.children[ast.children.length - 1],
        index: ast.children.length - 1
    };

    if (start && end) {
        ast.children = ast.children.slice((start as RangePoint).index, end.index + 1);
    }
}, 'extract-fragment');


