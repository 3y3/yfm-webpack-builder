import type { Root } from 'mdast';
import { asyncAstLoader } from '../utils';

import { options } from './options';

export default asyncAstLoader<{}, Root>(async function({ parser }) {
    const o = await options();

    Object.keys(o).forEach(key => parser.data(key, o[key]));
});