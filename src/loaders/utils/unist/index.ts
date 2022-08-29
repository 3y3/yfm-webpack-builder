import type { Node, Parent, Data } from 'unist';
import visit from 'unist-util-visit';
import pvisit, { EXIT, CONTINUE, SKIP } from 'unist-util-visit-parents';
import { select as _select, selectAll as _selectAll } from 'unist-util-select';
import { isArray, isObject } from '../../../utils';

export { visit, pvisit, EXIT, CONTINUE, SKIP };

export type LinkedNode = Node & {
    parent: Parent
};

export function isNode(node: any): node is Node {
    return isObject(node) && 'type' in node;
}

function isLinkedNode(node: any): node is LinkedNode {
    return Boolean(node?.parent);
}

export function getData<TData extends Data>(node: Node<TData>): TData {
    return node as unknown as TData;
}

export function select<T extends Node = Node>(selector: string, tree: Node | null | undefined): T | null {
    if (!tree) {
        return null;
    }

    return (_select(selector, tree) as T) || null;
}

export function selectAll<T extends Node = Node>(selector: string, tree: Node | null): T[] {
    if (!tree) {
        return [];
    }

    return (_selectAll(selector, tree) as T[]);
}

function drop(node: LinkedNode) {
    const index = node.parent.children.indexOf(node);
    node.parent.children.splice(index, 1);
}

export function remove(selector: Node | string | null, tree: Node) {
    if (!selector) {
        return;
    }

    const node = isNode(selector) ? selector : select(selector, tree);

    if (!node) {
        return;
    }

    if (isLinkedNode(node)) {
        drop(node);
    } else {
        find(node, tree, drop);
    }
}

export function removeAll(selector: string | Node[], tree: Node) {
    let nodes = isArray<Node>(selector) ? selector : selectAll(selector, tree);

    nodes = nodes.reduce((acc, node) => {
        if (isLinkedNode(node)) {
            drop(node);
        } else {
            acc.push(node);
        }

        return acc;
    }, [] as Node[]);

    if (!nodes.length) {
        return;
    }

    visit(tree, (leaf, index, parent) => {
        const found = nodes.indexOf(leaf);

        if (found > -1 && parent) {
            parent.children.splice(index, 1);
            nodes.splice(found, 1);

            return SKIP;
        }

        if (!nodes.length) {
            return EXIT;
        }

        return CONTINUE;
    });
}

type FindResult = {
    node: Node | null,
    parent: Parent | null,
    index: number,
    ancestors: Parent[]
};

export function find<T = LinkedNode>(
    node: Node | null,
    tree: Node,
    action?: (node: LinkedNode & T, index: number) => void
): FindResult {
    let ancestors: Parent[] = [];
    let parent: Parent | null = null;
    let index = -1;

    if (!node) {
        return { node, index, ancestors, parent };
    }

    pvisit(tree, node.type, (leaf, parents) => {
        if (leaf === node) {
            ancestors = parents as Parent[];
            parent = ancestors[ancestors.length - 1] as Parent;
            index = parent.children.indexOf(node);

            return EXIT;
        }

        return CONTINUE;
    });

    if (action && parent) {
        node = link(...ancestors, node);
        action(node as LinkedNode & T, index);
        node = unlink(node as LinkedNode);
    }

    return { node, index, ancestors, parent };
}

export function closest<T extends Node = Node>(node: Node | null, type: string, tree: Node): T | null {
    if (!node) {
        return null;
    }

    if (isLinkedNode(node)) {
        while (node) {
            const parent = (node as LinkedNode).parent as unknown as LinkedNode;

            if (parent?.type === type) {
                return parent as unknown as T;
            }

            node = parent;
        }
    } else {
        const { ancestors } = find(node, tree);

        while (ancestors.length) {
            const ancestor = ancestors.pop() as Node;
            if (ancestor.type === type) {
                return ancestor as T;
            }
        }
    }

    return null;
}

export function link(...nodes: Node[]): LinkedNode {
    const node = nodes[nodes.length - 1];

    while (nodes.length) {
        const node = nodes.pop() as LinkedNode;
        const parent = nodes[nodes.length - 1];

        if (parent) {
            node.parent = parent as Parent;
        }
    }

    return node as LinkedNode;
}

export function unlink(node: LinkedNode): Node {
    while (node) {
        const parent = node.parent;
        delete (node as Partial<LinkedNode>).parent;
        node = parent as unknown as LinkedNode;
    }

    return node;
}