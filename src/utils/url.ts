import { URLSearchParams } from 'url';
import { isAbsolute, relative, resolve } from 'path';

export function withQuery(url: string, query: Record<string, any>) {
    const [ path, rest ] = url.split('?');
    const prev = parseQuery(rest);
    const union = { ...prev, ...query };
    const result: Record<string, string> = {};

    Object.keys(union).forEach(key => {
        const value = union[key];

        if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
            result[key] = String(value);
        }
    });

    if (Object.keys(result).length) {
        return path + '?' + new URLSearchParams(result).toString();
    } else {
        return path
    }
}

export function parseQuery(query: string, filter?: string[]): Record<string, any> {
    query = (query || '').replace(/^\?/, '');

    const result: Record<string, string> = {};
    const params = new URLSearchParams(query).entries();

    for (const [ key, value ] of params) {
        if (filter && filter.length && filter.includes(key)) {
            result[key] = value;
        } else {
            result[key] = value;
        }
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

export function rebase(url: string, oldbase: string, newbase: string) {
    const [ _, path, rest ] = (/^(.*?)([?#])$/.exec(url) || []);

    if (!path) {
        return url;
    }

    return relative(oldbase, resolve(newbase, relative(oldbase, path))) + rest;
}