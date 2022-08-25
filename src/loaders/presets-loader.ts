import type { Vars } from '../presets';
import { dirname } from 'path'
import { resolvePresets } from '../presets';
import { asyncLoader } from './utils';

type PresetsLoaderOptions = {
    vars?: Vars;
    varsPreset?: string;
};

type Content = {
    [prop in string]?: Vars;
} & {
    default: Vars;
};

export default asyncLoader<PresetsLoaderOptions, Content>(async function(content) {
    const options = this.getOptions();
    const { vars = {}, varsPreset = 'default' } = options;

    const parent = await resolvePresets(dirname(this.context), this.rootContext, '', this);

    return {
        ...parent,
        ...(content.default || {}),
        ...(content[varsPreset] || {}),
        ...vars
    };
});