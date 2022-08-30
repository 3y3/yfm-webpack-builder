import type { Node } from 'unist';
import * as handlers from './handlers';
import { one } from './one';

export type Context = {
    handlers: Record<string, Handler>
};

export type Handler = {
    (t: Context, node: Node, result?: Record<string, any>): Record<string, any>;
}

export type Options = {
    handlers?: Record<string, Handler>
};

export function serialize(tree: Node, options: Options = {}) {
    const t = {
        handlers: Object.assign(handlers, options.handlers)
    };

    return one(t, tree);
}