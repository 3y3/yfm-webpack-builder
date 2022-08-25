import { pick } from 'lodash';
import { resolve, relative, isAbsolute } from 'path';

export function uniq(items: string[]) {
    return [ ...new Set(items) ];
}

export function isEmpty(target: any) {
    return typeof target === 'undefined' || !Boolean(target);
}

export function isObject(target: any): target is Object {
    return typeof target === 'object' && Boolean(target);
}

export function isArray<T = any>(target: any): target is T[] {
    return Array.isArray(target);
}

export function parseQuery(query: string, filter?: string[]): Record<string, any> {
    query = (query || '').replace(/^\?/, '')

    if (!query) {
        return {};
    }

    let result = JSON.parse(query);

    if (filter && filter.length) {
        result = pick(result, filter);
    }

    return result;
}

export function toLocalLink(path: string, base: string, root: string): string | null {
    if (/^.*?:\/\/.*$/.test(path)) {
        const file = /^file:\/\/(.*?)$/.exec(path);
        if (file) {
            return toLocalLink(file[1], base, root);
        }

        return null;
    }

    if (!isAbsolute(path)) {
        path = resolve(base, path);
    }

    if (!path.startsWith(root)) {
        return null;
    }

    return './' + relative(base, path);
}
