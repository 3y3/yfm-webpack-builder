import type { Title, Toc, TocTitleText } from '../../types';
import type { Context } from '../';
import { all } from '../all';
import assert from 'assert';

export function title(t: Context, node: Title, parent: Toc): TocTitleText | TocTitleText[] {
    const holder = {
        text: [] as TocTitleText[]
    };

    all(t, node, holder);

    const value = holder.text.length === 0
        ? ''
        : holder.text.length === 1
            ? holder.text[0]
            : holder.text;

    assert('title' in parent, 'Unexpected parent. `title` prop holder not found.');

    parent.title = value;

    return value;
}