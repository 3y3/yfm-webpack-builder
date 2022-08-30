import type { Include, TocInclude, TocItem } from '../../types';
import type { Context } from '../';
import assert from 'assert';
import { omit } from 'lodash';

export function include(_t: Context, node: Include, parent: TocItem): TocInclude {
    const result = omit(node, [ 'type', 'data', 'position' ]);

    assert(result.path, 'Missed required `path` prop in include.');

    assert('include' in parent, 'Unexpected parent. `include` prop holder not found.');

    parent.include = result;

    return result;
}