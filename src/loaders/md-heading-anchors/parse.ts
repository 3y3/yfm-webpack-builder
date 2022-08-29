import type { Root, Heading, Text } from 'mdast';
import type { Anchor } from '../utils/mdast';
import { Handle as MdastHandler } from 'mdast-util-to-markdown';
import { Handler as HastHandler } from 'mdast-util-to-hast';
import { anchor } from '../utils/mdast';
import { uniq, UniqueId } from '../../utils';
import { selectAll, select } from '../utils/unist';
import { asyncAstLoader } from '../utils';

type Options = {
    supportGithubAnchors: boolean;
    transformOnly: boolean;
};

type Item<T> = T extends Array<infer P> ? P : T;

export type HeadingWithAnchors = Heading & {
    children: (Item<Heading['children']> | Anchor)[]
};

const handler = {
    type: anchor.type,
    hast: function(h, node) {
        const { value } = node as Anchor;

        return h(node, 'a', {
            id: value,
            href: '#' + value
        });
    } as HastHandler,
    mdast: function(node) {
        const { value } = node as Anchor;

        return ` {#${ value }}`;
    } as MdastHandler
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
    const uniqueId = UniqueId();

    (selectAll<HeadingWithAnchors>('heading', ast)).forEach((node) => {
        const text = select<Text>('text', node) as Text;
        const [ title, ...anchors ] = splitTitle(text.value);

        node.children.push(...uniq(anchors).map(uniqueId).map(anchor));

        text.value = title;
    });

    compiler.handle(handler);
}, 'parse-anchors');