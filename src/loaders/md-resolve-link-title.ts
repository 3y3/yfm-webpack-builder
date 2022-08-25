import type { Link, Text } from 'mdast';
import { selectAll } from './utils/unist';
import { definitions } from './utils/mdast';
import { toLocalLink } from '../utils';
import { asyncAstLoader, loadModule } from './utils';

export default asyncAstLoader(async function({ ast }) {
    const defs = definitions(ast);

    const titles = (selectAll('link', ast) as Link[])
        .reduce((acc, node) => {
            const url = toLocalLink(defs(node.url)?.url || node.url, this.context, this.rootContext);

            if (url) {
                (selectAll('text[value="{#T}"]', node) as Text[])
                    .forEach((text) => acc.push([ url, text ]));
            }

            return acc;
        }, [] as [ string, Text ][]);

    await Promise.all(titles.map(async ([ url, node ]) => {
        const info = await loadModule(this, url + '?info', JSON.parse);

        node.value = info.title;
    }));

    return ast;
});