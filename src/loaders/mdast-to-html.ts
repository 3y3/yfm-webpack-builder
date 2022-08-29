import remarkRehype from 'remark-rehype';
import compileHtml from 'rehype-stringify';
import { asyncAstLoader } from './utils';

export default asyncAstLoader(async function({ compiler }) {
    compiler.use(remarkRehype, {
        handlers: compiler.handlers.hast
    });
    compiler.use(compileHtml);
}, 'md-to-html');