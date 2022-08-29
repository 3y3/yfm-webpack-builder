import type { Node } from 'unist';
import u from 'unist-builder';

const type = 'include';

export interface Include extends Node {
    type: 'include';
    path: string;
    fragment: string;
    notitle: string;
}

export const include = (url: string, notitle: string) => {
    const [ path, fragment ] = url.split('#');

    return u(type, { path, fragment, notitle }) as Include
};

include.type = type;