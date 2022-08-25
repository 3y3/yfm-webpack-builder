import remarkStringify from 'remark-stringify';
import { asyncAstLoader } from './utils';

export default asyncAstLoader(async function({ compiler }) {
    compiler.use(remarkStringify, {
        handlers: compiler.handlers.mdast
    });
});