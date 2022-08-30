import type { Text, TocTitleText, TocTitleHolder } from '../../types';
import type { Context } from '../';
import assert from 'assert';
import { omit } from 'lodash';

export function text(_t: Context, node: Text, parent: TocTitleHolder): TocTitleText {
    const holder = omit(node, [ 'type', 'data', 'position' ]);
    const keys = Object.keys(holder);

    assert('value' in node, 'Missed text value.');

    let result: TocTitleText;
    if (keys.length === 1) {
        result = node.value;
    } else {
        result = {
            ...omit(holder, [ 'value' ]),
            text: node.value
        } as TocTitleText;
    }

    assert('text' in parent, 'Unexpected parent. `text` prop holder not found.');
    assert(Array.isArray(parent.text), 'Unexpected parent. `text` prop is not typeof array.');

    parent.text.push(result);

    return result;
}