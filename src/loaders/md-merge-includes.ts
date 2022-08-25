import type { Content, Root, Text, Link, Paragraph, Parent, Literal } from 'mdast';
import { resolve } from 'path';
import { remove, visit } from './utils/unist';
import { toLocalLink } from '../utils';
import { asyncAstLoader, loadModuleAst } from './utils';
import { title } from './utils/mdast';

// Webpack fails to resolve *.d.ts
// @ts-ignore
import headingRange from 'mdast-util-heading-range';

const OPEN = /^{%\s*include(\s+notitle)?/;
const CLOSE = /\s*%}\s*/;

const match = (node: Literal, rx: RegExp) => rx.test(node?.value);

type IncludeInfo = {
    parent: Parent,
    index: number,
    path: string,
    fragment: string,
    notitle: string
};

type FragmentInfo = IncludeInfo & {
    root: Root
};

export default asyncAstLoader(async function({ ast }) {
    const includes: IncludeInfo[] = [];

    visit<Paragraph>(ast, 'paragraph', (node, index, parent) => {
        const [ open, link, close ] = node.children as [ Text, Link, Text ];

        if (match(open, OPEN) && match(close, CLOSE) && link?.url) {
            const [ path, fragment ] = link.url.split('#');
            const [ , notitle ] = OPEN.exec(open.value) || [];
            const url = toLocalLink(path, this.context, this.rootContext);

            if (parent && url) {
                includes.push({ parent: parent as Parent, index, path, fragment, notitle });
            }
        }
    });

    const deps = await Promise.all(includes.map(async (include) => {
        return {
            ...include,
            root: await loadModuleAst(this, resolve(this.context, include.path))
        } as FragmentInfo;
    }));

    let offset = 0;
    for (const dep of deps) {
        const { fragment, root, notitle, index, parent } = dep;

        if (fragment) {
            trimToFragment(root, fragment);
        }

        if (notitle) {
            removeTitle(root);
        }

        parent.children.splice(offset + index, 1, ...root.children);

        offset += root.children.length - 1;
    }

    return ast;
});

function trimToFragment(fragment: Root, hash: string) {
    const test = new RegExp('\\{#' + hash + '\\}');
    const range: Content[] = [];

    headingRange(fragment, test, (start: Content, nodes: Content[]) => {
        range.push(start, ...nodes);
    });

    fragment.children = range;
}

function removeTitle(fragment: Root) {
    remove(title(fragment), fragment);
}