import { asyncAstLoader } from './utils';
import compileJs from './utils/tocst/javascript';

export default asyncAstLoader(({ compiler }) => {
    compiler.use(compileJs);
});