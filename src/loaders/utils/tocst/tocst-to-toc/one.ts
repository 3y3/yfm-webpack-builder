import type { Node } from 'unist';
import type { Context } from '.';

const own = {}.hasOwnProperty

export function one(t: Context, node: Node, parent?: Record<string, any>) {
    if (!node || !node.type) {
        throw new Error('Expected node, not `' + node + '`');
    }

    if (!own.call(t.handlers, node.type)) {
        throw new Error('Cannot compile unknown node `' + node.type + '`');
    }

    return t.handlers[node.type](t, node, parent);
}
