import type { Node, Parent, Literal } from 'unist';

export enum Stage {
    NEW = 'new',
    PREVIEW = 'preview',
    TECH_PREVIEW = 'tech-preview',
    SKIP = 'skip',
}

export type Toc = {
    href: string;
    stage?: Stage;
    base?: string;
    items: TocItem[];
    title?: string | TocTitle | (string | TocTitle)[];
}

export type TocTitle = {
    text: string
}

export type TocItem = {
    name: string;
    href: string;
    items: TocItem[];
    include?: TocInclude;
    id?: string;
}

export enum IncludeMode {
    ROOT_MERGE = 'root_merge',
    MERGE = 'merge',
    LINK = 'link'
}

export type TocInclude = {
    repo: string;
    path: string;
    mode?: IncludeMode;
}

export type Root = Parent<Title | Item, Exclude<Toc, [ 'items', 'title' ]>>;

export type Title = Parent<Text>;

export type Text = Literal<string>;

export type Item = Parent<Item | Include, Exclude<TocItem, [ 'include', 'items' ]>>;

export interface Include extends Node {
    type: 'include',
    repo: string;
    path: string;
    mode?: IncludeMode;
}
