import type { Text, Link, Paragraph, Literal } from 'mdast';
import type { Visitor } from '../utils/unist';
import { visit, SKIP } from '../utils/unist';
import { asyncAstLoader } from '../utils';
import { Include, include } from '../utils/mdast';
import { Handle as MdastHandler } from 'mdast-util-to-markdown';
import { Handler as HastHandler } from 'mdast-util-to-hast';
import u from 'unist-builder';

const OPEN = /^{%\s*include(\s+notitle)?/;
const CLOSE = /\s*%}\s*/;

const match = (node: Literal, rx: RegExp) => rx.test(node?.value);

const handler = {
    type: include.type,
    hast: function (h, node) {
        let { path, fragment, title } = node as Include;

        fragment = fragment ? '#' + fragment : '';
        title = String(title || path).replace(/[ \t]*(\r?\n|\r)[ \t]*/g, '$1');

        return h(node, 'a', {
            href: path + fragment
        }, [
            h.augment(node, u('text', title))
        ]);
    } as HastHandler,
    mdast: function(node) {
        let { path, fragment, notitle } = node as Include;

        fragment = fragment ? '#' + fragment : '';
        notitle = notitle ? notitle + ' ' : '';

        return `{% include ${ path + fragment } ${ notitle }%}`
    } as MdastHandler
};

const findIncludes: Visitor<Paragraph> = function(node, index, parent) {
    const [ open, link, close ] = node.children as [ Text, Link, Text ];

    if (!parent || !match(open, OPEN) || !match(close, CLOSE) || !link?.url) {
        return SKIP;
    }

    const [ , notitle ] = OPEN.exec(open.value) || [];

    const child = include(link.url, link.title || '', notitle);

    if (child.path) {
        parent.children[index] = child;

        return SKIP;
    } else {
        // Ignore out of scope links
        // TODO: log this or caught
        parent.children.splice(index, 1);

        return [ SKIP, index ];
    }
};

export default asyncAstLoader(async function({ ast, compiler }) {
    visit(ast, 'paragraph', findIncludes);

    compiler.handle(handler);
}, 'parse-includes');