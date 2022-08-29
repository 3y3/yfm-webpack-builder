import type { Link, Text } from 'mdast';
import { selectAll } from './utils/unist';
import { definitions } from './utils/mdast';
import { withQuery } from '../utils';
import { asyncAstLoader, loadModuleJson } from './utils';

export default asyncAstLoader(async function({ ast, meta }) {
    const defs = definitions(ast);

    const titles = (selectAll('link', ast) as Link[])
        .reduce((acc, node) => {
            const url = defs(node.url)?.url || node.url;

            if (url) {
                (selectAll('link > text[value="{#T}"]', node) as Text[])
                    .forEach((text) => acc.push([ url, text ]));
            }

            return acc;
        }, [] as [ string, Text ][]);

    await Promise.all(titles.map(async ([ url, node ]) => {
        const [ path, fragment ] = url.split('#');

        const info = path
            ? await loadModuleJson(this, withQuery(path, { info: true }))
            : meta;

        if (fragment) {
            node.value = info.refs[fragment];
        } else if ('title' in info) {
            node.value = info.title;
        } else {
            this.emitWarning(new Error('Unable to resolve link title'));
        }
    }));
}, 'resolve-link-title');