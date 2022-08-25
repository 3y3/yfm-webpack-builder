import type { Node } from 'unist';
import type { Processor } from 'unified';
import type { Root, Text, Item, Include, Toc, TocItem, TocTitle, TocInclude } from './types';
import { omit } from 'lodash';
import { visit } from '../unist';
import { dump } from 'js-yaml';

type Compiler = (node: Node, objects: Map<Node, any>, object: any) => void;

type Options = {
    handlers?: Record<string, Compiler>
};

export default function(this: Processor, options: Options = {}) {
    this.Compiler = compile;

    const handlers: Record<string, Compiler> = {
        root, title, text, item, include,
        ...(options.handlers || {})
    };

    function compile(root: Node): string {
        const objects: Map<Node, any> = new Map();

        visit(root, (node, _index, parent) => {
            const object = objects.get(parent as Node);

            const visitor = handlers[node.type];

            if (visitor) {
                visitor(node, objects, object);
            }
        });

        const result = objects.get(root);

        return dump(result);

        // return JSON.parse(JSON.stringify(result));
    }
}

function root(node: Node, objects: Map<Node, any>) {
    const result = {
        ...omit(node as Root, [ 'type', 'children' ]),
        title: undefined,
        items: []
    };

    objects.set(node, result);
}

function item(node: Node, objects: Map<Node, any>, object: Toc | TocItem) {
    const items: TocItem[] = [];

    Object.defineProperty(items, 'toJSON', {
        value: function() {
            switch (true) {
                case this.length === 0:
                    return;
                default:
                    return this;
            }
        }
    });

    const result = {
        ...omit(node as Item, [ 'type', 'children' ]),
        items
    } as TocItem;

    object.items.push(result);
    objects.set(node, result);
}

function title(node: Node, objects: Map<Node, any>, object: Toc) {
    const result: TocTitle[] = [];

    Object.defineProperty(result, 'toJSON', {
        value: function() {
            switch (true) {
                case this.length === 1:
                    return this[0];
                case this.length === 0:
                    return;
                default:
                    return this;
            }
        }
    });

    object.title = result;
    objects.set(node, result);
}

function text(node: Node, objects: Map<Node, any>, object: (string | TocTitle)[]) {
    const keys = Object.keys(omit(node, [ 'type' ]));

    let result;
    if (keys.length === 1 && keys[0] === 'value') {
        result = (node as Text).value;
    } else {
        result = {
            ...omit(node as Text, [ 'type' ]),
            text: (node as Text).value
        } as TocTitle;
    }

    if (result) {
        object.push(result);
        objects.set(node, result);
    }
}

function include(node: Node, objects: Map<Node, any>, object: TocItem) {
    const result = omit(node as Include, [ 'type' ]) as TocInclude;

    object.include = result;
    objects.set(node, result);
}