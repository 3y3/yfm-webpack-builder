import { visit } from './utils/unist';
import { asyncAstLoader } from './utils';
import { Context, Liquid } from 'liquidjs';
import { resolvePresets } from '../presets';

const liquid = new Liquid();

const extract = (object: Record<string, any>, field: string) => {
    const value = object[field];
    delete object[field];
    return value;
};

export default asyncAstLoader(async function({ ast }) {
    const vars = await resolvePresets(this.context, this.rootContext, '', this);

    visit(ast, (node, index, parent) => {
        if (parent && 'when' in node) {
            const condition = extract(node, 'when');
            const isAccepted = isTruthly(condition, vars);

            if (!isAccepted) {
                parent.children.splice(index, 1);
            }
        }
    });
});

function isTruthly(value: boolean | string | undefined, vars: Record<string, unknown>) {
    return value === true || value === undefined || Boolean(typeof value === 'string' && evalExp(value, vars));
}

function evalExp(expr: string, vars: Record<string, unknown>) {
    return liquid.evalValueSync(expr, new Context(vars));
}