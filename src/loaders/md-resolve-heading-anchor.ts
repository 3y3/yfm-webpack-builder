import type { Root, Heading, Text, Literal } from 'mdast';
import { Handle as MdastHandler } from 'mdast-util-to-markdown';
import { Handler as HastHandler } from 'mdast-util-to-hast';
import GithubSlugger from 'github-slugger';
import slugify from 'slugify';
import u from 'unist-builder';
import { uniq } from '../utils';
import { selectAll, select } from './utils/unist';
import { asyncAstLoader } from './utils';

type Options = {
    supportGithubAnchors: boolean
};

type Item<T> = T extends Array<infer P> ? P : T;

export type Anchor = Literal;

export type HeadingWithAnchors = Heading & {
    children: (Item<Heading['children']> | Anchor)[]
};

const leaf = (text: string) => u(leaf.type, text) as Anchor;

leaf.type = 'heading-anchor';

leaf.hast = function(h, node) {
    const { value } = node as Anchor;

    return h(node, 'img', {
        id: value,
        href: '#' + value
    });
} as HastHandler;

leaf.mdast = function(node) {
    const { value } = node as Anchor;

    return ` {#${ value }}`;
} as MdastHandler;

const UniqueId = () => {
    const ids: Record<string, number> = {};

    return function uniqueId(id: string): string {
        if (ids[id]) {
            return uniqueId(id + ids[id]++);
        }

        ids[id] = 1;

        return id;
    }
};

function splitTitle(title: string): string[] {
    const anchors: string[] = [];

    title = title.replace(/\s*{#(.*?)}\s*/g, (_, $1) => {
        anchors.push($1);
        return ''
    });

    return [ title, ...anchors ];
}

export default asyncAstLoader<Options, Root>(async function({ ast, compiler }) {
    const { supportGithubAnchors = false } = this.getOptions();
    const uniqueId = UniqueId();
    const slugger = new GithubSlugger();

    (selectAll<HeadingWithAnchors>('heading', ast)).forEach((node) => {
        const text = select<Text>('text', node) as Text;
        const [ title, ...anchors ] = splitTitle(text.value);

        if (!anchors.length) {
            anchors.push(slugify(title, {
                lower: true,
                remove: /[*+~.()'"!:@`ь]/g,
            }));
        }

        if (supportGithubAnchors) {
            anchors.push(slugger.slug(title));
        }

        node.children.push(...uniq(anchors).map(uniqueId).map(leaf));

        text.value = title;
    });

    compiler.handle(leaf);

    return ast;
});