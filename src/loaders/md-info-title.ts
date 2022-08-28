import type { Root, Text } from 'mdast';
// import { basename, dirname } from 'path';
import { select } from './utils/unist';
import { title } from './utils/mdast';
import { asyncAstLoader } from './utils';

// function significantName(path: string) {
//     const name = basename(path);
//     const dir = basename(dirname(path));
//
//     if (name.match(/^index\..*?$/)) {
//         return dir;
//     } else {
//         return name;
//     }
// }

export default asyncAstLoader<{}, Root>(async function({ ast, meta }) {
    const node = select<Text>('text', title(ast));

    if (!node) {
        this.emitWarning(new Error('Missing document title for ' + this.resourcePath));

        // return { title: significantName(this.resourcePath) };
    } else {
        meta.title = node.value;
    }

    return node?.value || '';
});