import type { Compilation, Compiler } from 'webpack';
import { SyncWaterfallHook, AsyncSeriesWaterfallHook } from 'tapable';

const TocPlaceholder = Symbol('Toc');

type Callback<T extends any[] = any[]> = (...args: T) => void;

export enum Stage {
    NEW = 'new',
    PREVIEW = 'preview',
    TECH_PREVIEW = 'tech-preview',
    SKIP = 'skip',
}

export interface Toc {
    name: string;
    href: string;
    items: TocItem[];
    stage?: Stage;
    base?: string;
    title?: string | TocTitle;
    id?: string;
    singlePage?: boolean;
}

export type TocTitle<E extends Record<string, unknown> = {}> = { text: string } & E;

export type TocItem<E extends Record<string, unknown> = {}> = {
    name: string;
    href: string;
    items: TocItem[];
    include?: TocInclude;
    id?: string;
} & E;

export enum IncludeMode {
    ROOT_MERGE = 'root_merge',
    MERGE = 'merge',
    LINK = 'link'
}

export interface TocInclude {
    repo: string;
    path: string;
    mode?: IncludeMode;
}

type ExtCompilation = Compilation & {
    [TocPlaceholder]: TocProcessor;
};

export type VarsPreset = Record<string, any>;


export class TocProcessor {

    static from(compilation: ExtCompilation | any): TocProcessor {
        return compilation && compilation[TocPlaceholder] || new TocProcessor();
    }

    static hooks(compiler: Compiler, plugin: string, action: Callback<[ TocProcessor ]>) {
        compiler.hooks.thisCompilation.tap(plugin, (compilation: Compilation) => {
            action(TocProcessor.from(compilation));
        });
    }

    private readonly name: string;

    public readonly title: SyncWaterfallHook<[ TocTitle[], VarsPreset ]>;

    public readonly items: AsyncSeriesWaterfallHook<[ TocItem[], VarsPreset ]>;

    public readonly item: AsyncSeriesWaterfallHook<[ TocItem, VarsPreset ]>;

    public readonly finish: AsyncSeriesWaterfallHook<[ string, Toc ]>;

    constructor() {
        this.name = this.constructor.name;

        // Hooks called in toc-loader
        this.title = new SyncWaterfallHook([ 'title', 'vars' ]);
        this.items = new AsyncSeriesWaterfallHook([ 'items', 'vars' ]);
        this.item = new AsyncSeriesWaterfallHook([ 'item', 'vars' ]);
        this.finish = new AsyncSeriesWaterfallHook([ 'path', 'toc' ]);
    }

    apply(compiler: Compiler) {
        compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
            Object.assign(compilation, {
                [TocPlaceholder]: this
            });
        });
    }
}