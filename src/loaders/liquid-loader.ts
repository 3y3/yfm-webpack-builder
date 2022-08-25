import type { Token } from 'liquidjs';
import { Liquid, TokenKind } from 'liquidjs';
import { resolvePresets } from '../presets';
import { asyncLoader } from './utils';

class SkipTag {
    private token: OutputToken | null = null;

    parse(token: OutputToken) {
        this.token = token;
    }

    render() {
        return `\n{% ${ this.token?.content } %}\n`;
    }
}

const liquid = new Liquid();

liquid.registerTag('include', new SkipTag());

type OutputToken = Token & {
    content: string;
};

function isOutputToken(token: Token): token is OutputToken {
    return token.kind === TokenKind.Output;
}

export default asyncLoader<{}, string>(async function(content) {
    const templates = liquid.parse(content);
    const deps = Array.from(templates.reduce((acc, template) => {
        if (isOutputToken(template.token)) {
            acc.add(template.token.content);
        }

        return acc;
    }, new Set()));

    const query = '?' + JSON.stringify({ deps });
    const vars = await resolvePresets(this.context, this.rootContext, query, this);

    return liquid.render(templates, vars);
});
