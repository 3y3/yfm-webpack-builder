export type TocItemsHolder = {
    items: TocItem[]
};

export type TocRoot = TocItemsHolder & {
    title?: string
};

export type TocItem = TocItemsHolder & {
    href: string
};
