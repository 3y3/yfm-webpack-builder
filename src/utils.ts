import { resolve, relative, isAbsolute } from 'path';
import { URLSearchParams } from 'url';

export function uniq(items: string[]) {
    return [ ...new Set(items) ];
}

export function extract(from: any[], list: any[]) {
    return from.filter(value => !list.includes(value));
}

export function isEmpty(target: any) {
    return target === undefined || target === null;
}

export function isObject(target: any): target is Object {
    return typeof target === 'object' && Boolean(target);
}

export function isArray<T = any>(target: any): target is T[] {
    return Array.isArray(target);
}

export function isString(target: any): target is string {
    return typeof target === 'string';
}

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

export function UniqueId() {
    const ids: Record<string, number> = {};
    const modifier = function uniqueId(id: string): string {
        if (ids[id]) {
            return uniqueId(id + ids[id]++);
        }

        ids[id] = 1;

        return id;
    };

    modifier.add = (...keys: string[]) => {
        keys.forEach((id) => {
            ids[id] = (ids[id] || 0) + 1;
        });
    }

    return modifier;
}