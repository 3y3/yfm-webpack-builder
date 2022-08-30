import type { Parent } from 'unist';
import type { Context } from '.';
import { one } from './one';

export function all(t: Context, node: Parent, parent?: Record<string, any>) {
    return (node.children || []).map((node) => one(t, node, parent));
}
