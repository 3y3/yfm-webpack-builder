import type { Node } from 'unist';
import type { Processor } from 'unified';
import { visit } from '../unist';
import { omit, get, identity } from 'lodash';
import type { Root, Text } from './types';
import { isAbsolute } from 'path';

type Compiler = (node: Node, objects: Map<Node, any>, object: any) => void;

type Options = {
    compilers?: Record<string, Compiler>
};

export default function(this: Processor<Options>, options: Options = {}) {
    this.Compiler = compile;

    const compilers: Record<string, Compiler> = {
        root, title, text, item, include,
        ...(options.compilers || {})
    };

    function compile(toc: Node) {
        const objects: Map<Node, any> = new Map();

        visit(toc, (node, _index, parent) => {
            const object = objects.get(parent as Node);

            const compiler = compilers[node.type];

            if (compiler) {
                compiler(node, objects, object);
            }
        });

        return `module.exports = ${ objects.get(toc) }`;
    }
}

function prop(key: string, value: any, map?: (value: any) => string) {
    return `${ JSON.stringify(key) }: ${ (map || JSON.stringify)(value) }`;
}

function array(map: (value: any) => string) {
    return (values: any[]) => `[${ values.map(map).join(',') }]`;
}

function dep(key: string, value: string) {
    return `get [${ JSON.stringify(key) }]() { return require(${ JSON.stringify(value) }); }`;
}

function root(node: Node, objects: Map<Node, any>) {
    const props = Object.keys(omit(node as Root, [ 'type', 'children' ]))
        .map((key) => prop(key, get(node, key)));

    objects.set(node, {
        props,
        title: undefined,
        items: [],
        toString() {
            if (String(this.title)) {
                this.props.push(prop('title', String(this.title)));
            }

            if (this.items.length) {
                this.props.push(prop('items', this.items, array(String)));
            }

            return `{${ this.props.join(',') }}`
        }
    });
}

function item(node: Node, objects: Map<Node, any>, object: Record<string, any>) {
    const props = Object.keys(omit(node as Root, [ 'type', 'children', 'href', 'include' ]))
        .map((key) => prop(key, get(node, key)));

    const href = get(node, 'href');
    if (href) {
        props.push(dep('href', isAbsolute(href) ? href : './' + href));
    }

    const result = {
        props,
        include: null,
        items: [],
        toString() {
            if (this.items.length) {
                this.props.push(prop('items', this.items, array(String)));
            }

            if (this.include) {
                this.props.push(prop('include', this.include, identity));
            }

            return `{${ this.props.join(',') }}`
        }
    };

    objects.set(node, result);
    object.items.push(result);
}

function title(node: Node, objects: Map<Node, any>, object: { title: any }) {
    const result = {
        text: [],
        toString() {
            switch (true) {
                case this.text.length > 0:
                    return this.text[0];
                default:
                    return '';
            }
        }
    };

    object.title = result;
    objects.set(node, result);
}

function text(node: Node, objects: Map<Node, any>, object: { text: string[] }) {
    const result = String((node as Text).value);

    if (result) {
        object.text.push(result);
        objects.set(node, result);
    }
}

function include(node: Node, objects: Map<Node, any>, object: { include: string }) {
    const props = Object.keys(omit(node as Root, [ 'type', 'path' ]))
        .map((key) => prop(key, get(node, key)));

    const path = get(node, 'path');
    if (path) {
        props.push(dep('path', isAbsolute(path) ? path : './' + path));
    }

    const result = `{${ props.join(',') }}`;

    object.include = result;
    objects.set(node, result);
}