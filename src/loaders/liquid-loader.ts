import type { TopLevelToken } from 'liquidjs';
import { Liquid, TokenKind, Token } from 'liquidjs';
import { resolvePresets } from '../presets';
import { asyncLoader } from './utils';

class SkipTag {
    private token: OutputToken | null = null;

    constructor(private readonly fixLine: boolean = false) {}

    parse(token: OutputToken) {
        this.token = token;
    }

    render() {
        if (this.fixLine) {
            return `\n{% ${ this.token?.content } %}\n`;
        } else {
            return `{% ${ this.token?.content } %}`;
        }
    }
}

export class HTMLToken extends Token {
    trimLeft = 0
    trimRight = 0
    constructor (
        public input: string,
        public begin: number,
        public end: number,
        public file?: string
    ) {
        super(TokenKind.HTML, input, begin, end, file)
    }
    public getContent () {
        return this.input.slice(this.begin + this.trimLeft, this.end - this.trimRight)
    }
}

const varsRx = /^[.\s\w-(),]+$/m;
const liquid = new Liquid();

function hasBannedChars(token: OutputToken) {
    token.content = token.content.replace(/\|/g, '-');

    if (!varsRx.test(token.content)) {
        console.log(token.content);
    }

    return !varsRx.test(token.content);
}


const superParse = liquid.parser.parseTokens;
liquid.parser.parseTokens = function parseTokens(tokens: TopLevelToken[]) {
    let index = 0;
    while (tokens[index]) {
        const token = tokens[index];
        if (isOutputToken(token)) {
            if (hasBannedChars(token)) {
                tokens[index] = new HTMLToken(token.input, token.begin, token.end, token.file);
            }
        }
        index++;
    }

    return superParse.call(this, tokens);
};

liquid.registerTag('include', new SkipTag(true));
liquid.registerTag('note', new SkipTag());
liquid.registerTag('endnote', new SkipTag());
liquid.registerTag('list', new SkipTag());
liquid.registerTag('endlist', new SkipTag());
liquid.registerTag('cut', new SkipTag());
liquid.registerTag('endcut', new SkipTag());

liquid.registerFilter('string', (initial, arg1, arg2) => {
    console.log('STRING', initial, arg1, arg2);

    throw new Error();

    return initial;
});

type OutputToken = Token & {
    content: string;
};

function isOutputToken(token: Token): token is OutputToken {
    return token.kind === TokenKind.Output;
}

export default asyncLoader<{}, string>(async function(content) {
    try {
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
    } catch (error) {
        console.error(error);
        throw error;
    }
});
