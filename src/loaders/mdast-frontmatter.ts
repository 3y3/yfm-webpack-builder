import { asyncAstLoader } from './utils';
import remarkFrontmatter from 'remark-frontmatter';

export default asyncAstLoader(async function({ parser, compiler  }) {
    parser.use(remarkFrontmatter, ['yaml', 'toml']);
    compiler.use(remarkFrontmatter, ['yaml', 'toml']);
});