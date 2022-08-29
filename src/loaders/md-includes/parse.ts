import type { Text, Link, Paragraph, Literal } from 'mdast';
import { visit, SKIP } from '../utils/unist';
import { asyncAstLoader } from '../utils';
import { include } from '../utils/mdast';

const OPEN = /^{%\s*include(\s+notitle)?/;
const CLOSE = /\s*%}\s*/;

const match = (node: Literal, rx: RegExp) => rx.test(node?.value);

export default asyncAstLoader(async function({ ast }) {
    visit<Paragraph>(ast, 'paragraph', (node, index, parent) => {
        const [ open, link, close ] = node.children as [ Text, Link, Text ];

        if (!parent || !match(open, OPEN) || !match(close, CLOSE) || !link?.url) {
            return SKIP;
        }

        const [ , notitle ] = OPEN.exec(open.value) || [];

        const child = include(link.url, notitle);

        if (child.path) {
            parent.children[index] = child;

            return SKIP;
        } else {
            parent.children.splice(index, 1);

            this.emitWarning(new RangeError(`Link (${link.url}) refers to source out of project scope.`));

            return [ SKIP, index ];
        }
    });
}, 'parse-includes');
