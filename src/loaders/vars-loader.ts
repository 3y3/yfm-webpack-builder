import { pick } from 'lodash';
import { LoaderContext } from 'webpack';

function getOptions(query: string) {
    if (!query) {
        return {};
    }

    return JSON.parse(query.slice(1));
}

export default function(this: LoaderContext<{ deps: string[] }>, content: Record<string, unknown>) {
    const { deps } = getOptions(this.resourceQuery || '');

    return JSON.stringify(deps ? pick(content, deps) : content);
}