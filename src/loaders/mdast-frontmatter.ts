import { asyncAstLoader } from './utils';
import remarkFrontmatter from 'remark-frontmatter';

export default asyncAstLoader(async function({ parser  }) {
    parser.use(remarkFrontmatter, ['yaml', 'toml']);
});