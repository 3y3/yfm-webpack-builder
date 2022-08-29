import { LoaderContext } from 'webpack';

import { getAst } from './utils';

export default function(this: LoaderContext<any>, _content: any, _map: any, meta: Record<string, any>) {
    return JSON.stringify(getAst(meta));
}