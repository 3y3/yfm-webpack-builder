import type { Nullable, Item, TocItem, TocItemsHolder } from '../../types';
import type { Context } from '../';
import { all } from '../all';
import assert from 'assert';
import { omit } from 'lodash';

export function item(t: Context, node: Item, parent: TocItemsHolder): TocItem {
    const holder  = {
        ...omit(node, [ 'type', 'data', 'position', 'children' ]),
        include: null,
        items: [],
    };

    all(t, node, holder);

    const result = clean(holder);

    // console.log(result, node);

    // assert(result.name, 'Missing required item prop `name`');
    // if (!result.items) {
    //     assert(result.href, 'Missing required item prop `href`');
    // }
    assert('items' in parent, 'Unexpected parent. `items` prop holder not found.');
    assert(Array.isArray(parent.items), 'Unexpected parent. `items` prop is not typeof array.');

    parent.items.push(result);

    return result;
}

function clean(holder: Nullable<TocItem> & TocItemsHolder): TocItem {
    if (!holder.items.length) {
        delete (holder as TocItem).items;
    }

    Object.keys(holder).forEach((key) => {
        if (!holder[key as keyof TocItem]) {
            delete (holder as TocItem)[key as keyof TocItem];
        }
    });

    return holder as TocItem;
}