import type { Root, Heading } from 'mdast';
import definitions from 'mdast-util-definitions';
import { select } from '../unist';

export type { Anchor } from './anchor';
export { anchor } from './anchor';

export type { Include } from './include';
export { include } from './include';

export { definitions };

export function title(page: Root): Heading | null {
    return select<Heading>(':root > heading[depth=1]:first-child', page);
}

export function header(page: Root): Heading | null {
    return select<Heading>(':root > heading:first-child', page);
}