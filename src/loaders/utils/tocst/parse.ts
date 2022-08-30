import type { Processor } from 'unified';
import type { Root, Title, Item, Text, Include, Toc, TocTitleText, TocItem, TocInclude } from './types';
import { IncludeMode } from './types';
import u from 'unist-builder';
import { omit } from 'lodash';
import { load } from 'js-yaml';
import { isArray, isObject } from '../../../utils';

export default function(this: Processor) {
    this.Parser = parse;
}

function parse(toc: string | Toc) {
    if (typeof toc === 'string') {
        toc = load(toc) as Toc;
    }

    return root(toc as Toc);
}

function root(node: Toc): Root {
    return u(
        'root',
        omit(node, [ 'items', 'title' ]),
        [
            title(node),
            ...items(node)
        ]
    );
}

function title(node: Toc): Title {
    return u('title', {}, [
        ...([] as Text[]).concat(text(node.title || ''))
    ]);
}

function text(value: TocTitleText | TocTitleText[]): Text | Text[] {
    if (typeof value === 'string') {
        return u('text', value);
    } else if (isArray(value)) {
        // TODO: is it possible what text contains array of texts?
        return value.map(text) as Text[];
    } else if (isObject(value)) {
        return u('text', omit(value, [ 'text', 'value' ]), value.text);
    }

    return u('text', String(value));
}

function items(node: Toc | TocItem): Item[] {
    return (node.items || []).map(item);
}

function item(node: TocItem, index: number): Item {
    const includes = node.include ? [ include(node.include) ] : [];
    const items = node.items ? node.items.map(item) : [];
    const data = {
        ...omit(node, [ 'id', 'include', 'items' ]),
        id: `${ node.name }-${ index }-${ Math.random() }`
    };

    return u('item', data, [ ...includes, ...items ]);
}

function include(node: TocInclude): Include {
    return u('include', {
        mode: IncludeMode.ROOT_MERGE,
        ...node
    });
}