import type { Root } from '../../types';
import type { Context } from '../';
import { all } from '../all';
import { omit } from 'lodash';
import { Nullable, Toc, TocItem, TocItemsHolder } from '../../types';

export function root(t: Context, node: Root) {
    const holder = {
        ...omit(node, [ 'type', 'data', 'position', 'children' ]),
        title: null,
        items: [],
    };

    all(t, node, holder);

    const result = clean(holder);

    return result;
}

function clean(holder: Nullable<Toc> & TocItemsHolder): Toc {
    if (!holder.items.length) {
        delete (holder as TocItem).items;
    }

    Object.keys(holder).forEach((key) => {
        if (!holder[key as keyof Toc]) {
            delete (holder as TocItem)[key as keyof TocItem];
        }
    });

    return holder as Toc;
}