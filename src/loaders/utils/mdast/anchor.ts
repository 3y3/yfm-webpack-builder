import type { Literal } from 'mdast';
import u from 'unist-builder';

const type = 'heading-anchor';

export interface Anchor extends Literal {
    type: 'heading-anchor'
}

export const anchor = (text: string) => u(type, text) as Anchor;

anchor.type = type;