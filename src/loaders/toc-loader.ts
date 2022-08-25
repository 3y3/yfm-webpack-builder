import type { LoaderContext } from 'webpack';
import type { Toc, TocTitle } from '../plugins/TocProcessor';
import { TocProcessor } from '../plugins/TocProcessor';
import { relative } from 'path';
import { get } from 'lodash';
import { resolvePresets } from '../presets';
import { isArray, isObject, parseQuery } from '../utils';
import { asyncLoader } from './utils';

type TocLoaderOptions = {
    base?: string;
    ignoreStage?: string;
};

function getOptions(ctx: LoaderContext<TocLoaderOptions>) {
    return {
        base: '',
        ...ctx.getOptions(),
        ...parseQuery(ctx.resourceQuery)
    };
}

export default asyncLoader<TocLoaderOptions, Toc>(async function(content) {
    const options = getOptions(this);
    const { ignoreStage } = options;

    if (content.stage === ignoreStage) {
        return '';
    }

    const vars = await resolvePresets(this.context, this.rootContext, '', this);
    const toc = TocProcessor.from(this._compilation);

    if (content.title) {
        // Get first contentful text title
        const title = toc.title.call(normalizeTitle(content.title), vars)[0] || { text: '' };

        content.title = get(title, 'text', '');
    }

    content.base = relative(this.context, this.rootContext) || '.';

    await toc.finish.promise(this.resourcePath, content);

    return JSON.stringify(content, null, 2);
});

function normalizeTitle(title: string | TocTitle | TocTitle[]): TocTitle[] {
    function normalize(title: string | TocTitle): TocTitle {
        if (isObject(title)) {
            return (title as TocTitle);
        } else {
            return { text: (title as string) };
        }
    }

    if (isArray(title)) {
        return title.map(normalize);
    } else {
        return [ normalize(title) ];
    }
}