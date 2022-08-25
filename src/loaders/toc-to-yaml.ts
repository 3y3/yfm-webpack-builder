import { asyncAstLoader } from './utils';
import compileYaml from './utils/tocst/yaml';

export default asyncAstLoader(({ compiler }) => {
    compiler.use(compileYaml);
});