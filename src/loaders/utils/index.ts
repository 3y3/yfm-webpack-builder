import type { LoaderContext, NormalModule } from 'webpack';
import type { Node } from 'unist';
import type { Processor } from 'unified';
import type { Handle as MdastHandler, Handlers as MdastHandlers } from 'mdast-util-to-markdown';
import type { Handler as HastHandler, Handlers as HastHandlers } from 'mdast-util-to-hast';
import unified from 'unified';
import { resolve, relative } from 'path';
import { isEmpty, isObject, isArray, isString, toLocalLink } from '../../utils';
import { isNode } from './unist';

const Ast = Symbol('Ast');
const Meta = Symbol('Meta');
const Parser = Symbol('Parser');
const Compiler = Symbol('Compiler');

const hidden = (box: Record<symbol | string, any>, key: symbol, ...args: any[]) => {
    if (args.length) {
        box[key] = args[0];
    } else {
        return box[key];
    }
};

export const getAst = (box: Record<symbol | string, any>) => hidden(box, Ast);

export const getMeta = (box: Record<symbol | string, any>) => hidden(box, Meta);

export async function exists(ctx: LoaderContext<any>, path: string) {
    return new Promise((resolve) => {
        ctx.fs.stat(path, (error, stat) => {
            resolve(!error && stat);
        });
    });
}

export function loadModule<T = string>(
    ctx: LoaderContext<any>,
    path: string,
    parse: (content: any, map: any, module: NormalModule) => T = (content: T) => content
): Promise<T> {
    return new Promise((resolve, reject) => {
        const securePath = toLocalLink(path, ctx.context, ctx.rootContext);

        if (!securePath) {
            throw new TypeError(`Attempt acces to out of project scope resource! (${ path })`);
        }

        ctx.loadModule(securePath, (error, content, map, module) => {
            if (error) {
                return reject(error);
            }

            resolve(parse(content, map, module));
        });
    });
}

export function loadModuleAst<T extends Node = Node>(
    ctx: LoaderContext<any>,
    path: string
): Promise<T> {
    return loadModule<T>(ctx, path, (content: string, _map: any, module: NormalModule) => {
        let ast = getAst(module) as T;

        // If module loaded from cache, there is no attached ast.
        // So we parse saved ast from content.
        if (!ast) {
            ast = JSON.parse(content);
        }

        return ast;
    });
}

export function loadModuleMeta<T extends Record<string | symbol, any>>(
    ctx: LoaderContext<any>,
    path: string
): Promise<T> {
    return loadModule<T>(ctx, path, (_content: any, _map: any, module: NormalModule) => getMeta(module) as T);
}

export function loadModuleJson<T extends Record<string | symbol, any>>(
    ctx: LoaderContext<any>,
    path: string
): Promise<T> {
    return loadModule<T>(ctx, path, JSON.parse);
}

type Loader<O = any, T = string> = (
    this: LoaderContext<O>,
    content: T,
    map: any,
    meta: Record<string | symbol, any>
) => Promise<any> | any;

export function asyncLoader<O = any, T = string>(loader: Loader<O, T>) {
    return async function(this: LoaderContext<O>, content: T, map?: any, meta?: Record<string | symbol, any>) {
        const callback = this.async();

        meta = meta || {};

        try {
            const result = await loader.call(this, content, map, meta);

            if (isArray(result)) {
                callback(null, ...result);
            } else {
                callback(null, result);
            }
        } catch (error) {
            console.error(error);
            callback(error as Error);
        }
    }
}

type AstLoaderCallback<Options, Result, AtsRoot = Node> = (
    this: LoaderContext<Options>,
    scope: {
        content: Node | string,
        ast: AtsRoot;
        meta: Record<string | symbol, any>;
        processor: Processor;
        parser: Processor;
        compiler: ExtendableProcessor
    }
) => Promise<Result> | Result;

export function asyncAstLoader<Options extends Record<string, any> = any,
    AtsRoot extends Node = Node,
    Result = any>(loader: AstLoaderCallback<Options, Result, AtsRoot>, _displayName?: string) {
    return asyncLoader(async function(content, _map: any, meta) {
        const module = this._module as NormalModule;

        meta = meta || {};

        let ast = hidden(meta, Ast);

        const parser = hidden(meta, Parser) || withHandlers(unified());
        const compiler = hidden(meta, Compiler) || withHandlers(unified());
        const processor = unified();

        // console.log('Run', _displayName, 'on', this.resource);
        const result = await loader.call(this, { content, ast, meta, parser, compiler, processor });

        ast = isNode(result) ? result : ast;

        hidden(module, Ast, ast);
        hidden(module, Meta, meta);

        if (this.loaderIndex === 0) {
            hidden(meta, Ast, undefined);
            hidden(meta, Parser, undefined);
            hidden(meta, Compiler, undefined);

            content = isEmpty(result) || isNode(result)
                ? compiler.stringify(await compiler.run(ast))
                : isObject(result)
                    ? JSON.stringify(result)
                    : String(result);
        } else {
            hidden(meta, Ast, ast);
            hidden(meta, Parser, parser);
            hidden(meta, Compiler, compiler);

            content = isString(result) ? result : content;
        }

        return [ content, null, meta ];
    } as Loader<Options, Node | string>);
}

export type ExtendableProcessor = Processor & {
    handle(leaf: Leaf): void;
    handlers: {
        readonly hast: HastHandlers;
        readonly mdast: MdastHandlers;
    }
};

export type Leaf = {
    type: string;
    hast: HastHandler;
    mdast: MdastHandler;
}

function withHandlers(processor: Processor) {
    const ast: {
        hast: HastHandlers;
        mdast: MdastHandlers
    } = {
        hast: {},
        mdast: {}
    };

    return Object.assign(processor, {
        handle: (leaf: Leaf) => {
            ast.hast[leaf.type] = leaf.hast;
            ast.mdast[leaf.type] = leaf.mdast;
        },
        handlers: {
            get hast() {
                return ast.hast
            },
            get mdast() {
                return ast.mdast
            },
        }
    });
}

export function emitFile(ctx: LoaderContext<any>, path: string, source: string | Buffer) {
    const file = relative(ctx.rootContext, resolve(ctx.context, path));

    ctx.emitFile(file, source);
}