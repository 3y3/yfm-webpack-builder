import { removeAll } from './utils/unist';
import { asyncAstLoader } from './utils';

type Options = {
    removeHiddenItems: boolean;
}

export default asyncAstLoader<Options>(async function({ ast }) {
    const { removeHiddenItems = false } = this.getOptions();

    if (removeHiddenItems) {
        removeAll('item[hidden=true]', ast);
    }
});