declare module 'mdast-util-heading-range' {
    import type { Node } from 'unist';
    import type { Content } from 'mdast';

    interface Callback {
        (start: Content, nodes: Content[], end: Content): void;
    }

    interface HeadingRange {
        (node: Node, test: RegExp, callback: Callback): void;
    }

    declare const headingRange: HeadingRange;

    export = headingRange;
}