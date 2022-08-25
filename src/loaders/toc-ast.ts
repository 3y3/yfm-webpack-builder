import parseText from './utils/tocst/parse';
import { asyncAstLoader } from './utils';

export default asyncAstLoader(function({ parser, content }) {
    return parser.use(parseText).parse(content);
});