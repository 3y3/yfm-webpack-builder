import parseText from 'remark-parse';
import { asyncAstLoader } from './utils';

export default asyncAstLoader(async function({ parser, content }) {
    return parser.use(parseText).parse(content);
});