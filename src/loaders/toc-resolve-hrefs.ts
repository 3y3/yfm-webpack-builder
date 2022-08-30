import { selectAll } from './utils/unist';
import { Item } from './utils/tocst';
import { asyncAstLoader, emitFile, loadModule } from './utils';
// import { resolve } from "path";
import { LoaderContext } from 'webpack';
import { toLocalLink } from '../utils';

// type LoaderOptions = {
//     base?: string;
// };

// function getOptions(ctx: LoaderContext<LoaderOptions>) {
//     return {
//         base: '',
//         ...ctx.getOptions(),
//         ...parseQuery(ctx.resourceQuery, [ 'base' ])
//     };
// }

async function emitModule(ctx: LoaderContext<any>, path: string) {
    const source = await loadModule(ctx, path);

    await emitFile(ctx, path, source);
}

export default asyncAstLoader(async function({ ast }) {
    // const options = getOptions(this);
    const items = selectAll<Item>('item[href]', ast);

    for (const item of items) {
        if (item.href) {
            const link = toLocalLink(item.href, this.context, this.rootContext);

            // console.log(data.href, link);

            if (link && link.match(/\.md$/)) {
                await emitModule(this, link);
                // data.href = resolvePath(data.href, this.context, options.base);
            }
        }
    }
});

// function resolvePath(path: string, context: string, base?: string) {
//     const query = base ? '?' + JSON.stringify({ base }) : '';
//     // const root = resolve(context, base || '.');
//
//     return resolve(context, path) + query;
// }