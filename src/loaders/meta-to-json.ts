import { LoaderContext } from 'webpack';

export default function(this: LoaderContext<any>, _content: any, _map: any, meta: Record<string, any>) {
    return JSON.stringify(meta);
}