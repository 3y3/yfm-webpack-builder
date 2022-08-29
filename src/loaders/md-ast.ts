import parseText from 'remark-parse';
import { asyncAstLoader } from './utils';

const astByContent = new Map();
const contentByPath = new Map();

const clone = (ast: string) => JSON.parse(ast);

type Options = {
    nocache: boolean;
};

export default asyncAstLoader<Options>(async function({ parser, content }) {
    const { nocache = false } = this.getOptions();
    const parse = (content: string) => parser.use(parseText).parse(content);

    if (nocache) {
        return parse(content as string);
    }

    const prevContent = contentByPath.get(this.resourcePath);
    const cached = prevContent === content && astByContent.get(content);
    const ast = cached ? clone(cached) : await parse(content as string);

    contentByPath.set(this.resourcePath, content);

    astByContent.delete(prevContent);
    astByContent.set(content, JSON.stringify(ast));

    return ast;
}, 'md-ast');