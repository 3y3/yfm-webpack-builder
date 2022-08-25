import { dirname, join } from 'path';
import { exists, loadModule } from './loaders/utils';
import { LoaderContext } from 'webpack';

export type Vars = Record<string, unknown>;

export async function resolvePresets(
    path: string,
    root: string,
    query: string,
    ctx: LoaderContext<any>
): Promise<Vars> {
    while (path.startsWith(root)) {
        const presets = join(path, 'presets.yaml');

        if (await exists(ctx, presets)) {
            return await loadModule<Vars>(ctx, presets + query, JSON.parse);
        } else {
            ctx.addMissingDependency(presets + query);
        }

        path = dirname(path);
    }

    return {};
}
