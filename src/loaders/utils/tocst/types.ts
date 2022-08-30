import type { Node, Parent, Literal } from 'unist';

export type Nullable<T extends Record<string, any>> = {
    [key in keyof T]?: T[key] | null | undefined;
}

export enum Stage {
    NEW = 'new',
    PREVIEW = 'preview',
    TECH_PREVIEW = 'tech-preview',
    SKIP = 'skip',
}

export type Toc = {
    href: string;
    items?: TocItem[];
    stage?: Stage;
    base?: string;
    title?: TocTitleText | TocTitleText[];
};

export type TocTitleText = string | {
    text: string;
    [prop: string]: string;
};

export type TocTitleHolder = {
    text: (string | TocTitleText)[];
};

export type TocItem = ({
    name: string;
    href: string;
    include?: TocInclude;
} | {
    name?: string;
    include: TocInclude;
}) & {
    id?: string;
    items?: TocItem[];
};

export type TocItemsHolder = {
    items: TocItem[];
};

export enum IncludeMode {
    ROOT_MERGE = 'root_merge',
    MERGE = 'merge',
    LINK = 'link'
}

export type TocInclude = {
    path: string;
    repo?: string;
    mode?: IncludeMode;
}

export interface Root extends Parent<Title | Item> {
    href: string;
    stage?: Stage;
    base?: string;
}

export interface Title extends Parent<Text> {
    type: 'title';
}

export interface Text extends Literal<string> {
    type: 'text';
}

export interface Item extends Parent {
    type: 'item';
    href?: string;
    name?: string;
    id?: string;
    children: (Item | Include)[];
}

export interface Include extends Node {
    type: 'include';
    path: string;
    repo?: string;
    mode?: IncludeMode;
}
