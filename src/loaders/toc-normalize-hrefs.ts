import { selectAll, getData } from './utils/unist';
import { Item } from './utils/tocst';
import { asyncAstLoader } from './utils';
import { resolve } from 'path';
import { LoaderContext } from 'webpack';
import { parseQuery } from '../utils';

type LoaderOptions = {
    base?: string;
};

function getOptions(ctx: LoaderContext<LoaderOptions>) {
    return {
        base: '',
        ...ctx.getOptions(),
        ...parseQuery(ctx.resourceQuery, [ 'base' ])
    };
}

export default asyncAstLoader(async function({ ast }) {
    const options = getOptions(this);
    const items = selectAll<Item>('item[href]', ast);

    items.forEach((item) => {
        const data = getData(item);

        if (data.href.match(/\.md$/)) {
            data.href = resolvePath(data.href, this.context, options.base);
        }
    });
});

function resolvePath(path: string, context: string, base?: string) {
    const query = base ? '?' + JSON.stringify({ base }) : '';
    // const root = resolve(context, base || '.');

    return resolve(context, path) + query;
}