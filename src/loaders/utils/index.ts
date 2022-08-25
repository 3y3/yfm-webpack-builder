import type { LoaderContext, NormalModule } from 'webpack';
import type { Node } from 'unist';
import type { Processor } from 'unified';
import type { Handle as MdastHandler, Handlers as MdastHandlers } from 'mdast-util-to-markdown';
import type { Handler as HastHandler, Handlers as HastHandlers } from 'mdast-util-to-hast';
import unified from 'unified';
import { resolve, relative } from 'path';
import { isEmpty, isObject, isArray } from '../../utils';
import { isNode } from './unist';

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
        ctx.loadModule(path, (error, content, map, module) => {
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
    return loadModule<T>(ctx, path, (_content: any, _map: any, module: NormalModule) => {
        return getModuleAst(module) as T;
    });
}

type Loader<O = any, T = string> = (
    this: LoaderContext<O>,
    content: T,
    map: any,
    meta: Record<string | symbol, any>
) => Promise<any> | any;

export function asyncLoader<O = any, T = string>(loader: Loader<O, T>) {
    return async function(this: LoaderContext<O>, content: T, map?: any, meta?: Record<string, any>) {
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
            callback(error as Error);
        }
    }
}

type AstLoaderCallback<Options, Result, AtsRoot = Node> = (
    this: LoaderContext<Options>,
    scope: {
        content: Node | string,
        ast: AtsRoot;
        processor: Processor;
        parser: Processor;
        compiler: ExtendableProcessor
    }
) => Promise<Result> | Result;

const Ast = Symbol('Ast');
const Parser = Symbol('Parser');
const Compiler = Symbol('Compiler');

function setModuleAst(module: Record<string | symbol, any> | undefined, ast: Node) {
    if (module) {
        module[Ast] = ast;
    }
}

function getModuleAst(module: Record<string | symbol, any> | undefined): Node | undefined {
    return module && module[Ast];
}

export function asyncAstLoader<Options extends Record<string, any> = any,
    AtsRoot extends Node = Node,
    Result = any>(loader: AstLoaderCallback<Options, Result, AtsRoot>) {
    return asyncLoader(async function(content, _map: any, meta) {
        meta = meta || {};

        const ast = meta[Ast];
        const parser = meta[Parser] || withHandlers(unified());
        const compiler = meta[Compiler] || withHandlers(unified());
        const processor = unified();

        const result = await loader.call(this, { content, ast, parser, compiler, processor });

        setModuleAst(this._module, isNode(result) ? result : ast);

        if (this.loaderIndex === 0) {
            content = isEmpty(result)
                ? compiler.stringify(await compiler.run(ast))
                : isNode(result)
                    ? compiler.stringify(await compiler.run(result))
                    : isObject(result)
                        ? JSON.stringify(result)
                        : String(result);

            return [ content, null, meta ];
        } else {
            return [
                // For best caching we return string content in common case
                isEmpty(result) ? content : result,
                null,
                Object.assign(meta, {
                    [Ast]: isNode(result) ? result : ast,
                    [Parser]: parser,
                    [Compiler]: compiler
                })
            ];
        }
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
    (...args: any[]): Node;
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