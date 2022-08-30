import type { RuleSetRule } from 'webpack';
import { resolve } from 'path';
import { pick } from 'lodash';

export const useful = <T>(array: (T | boolean)[]): T[] => array.filter(Boolean) as T[];

export const loader = (root: string, scope: string) => (loader: string, options?: Record<string, any>) => ({
    loader: resolve(root, scope, loader),
    options: options || {}
});

export const options = (options: Record<string, any>) => (props: string[]) => pick(options, props);

export const use = (
    loaders: (boolean | ReturnType<ReturnType<typeof loader>>)[],
    type = 'asset/resource'
) => ({
    type: type,
    use: useful(loaders)
});

export const oneOf = (rules: (boolean | RuleSetRule)[]) => ({
    oneOf: useful(rules)
});

export const rules = (rules: (boolean | RuleSetRule)[], rest = {}) => ({
    rules: useful(rules),
    ...rest
});

export const defaults = use;
export const allways = use;

export const queried = (
    modifier: string,
    loaders: (boolean | ReturnType<ReturnType<typeof loader>>)[],
    type = 'json'
) => ({
    resourceQuery: new RegExp(`[?&]${modifier}=`),
    ...use(loaders, type)
});