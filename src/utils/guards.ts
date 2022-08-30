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

