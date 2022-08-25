import type { Root, Heading } from 'mdast';
import definitions from 'mdast-util-definitions';
import { select, closest } from '../unist';

export { definitions };

export function title(page: Root): Heading | null {
    return select<Heading>(':root > heading:first-child', page);
}

export function anchor(page: Root, anchor: string): Heading | null {
    const text = select<Heading>(`:root > heading > text[value*={#${ anchor }]`, page);

    return closest<Heading>(text, 'heading', page);
}