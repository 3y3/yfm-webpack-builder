import type { Root, Heading, Text } from 'mdast';
import type { Anchor } from '../utils/mdast';
import { anchor } from '../utils/mdast';
import GithubSlugger from 'github-slugger';
import slugify from 'slugify';
import { uniq, extract, UniqueId } from '../../utils';
import { selectAll, select } from '../utils/unist';
import { asyncAstLoader } from '../utils';

type Options = {
    supportGithubAnchors: boolean;
    transformOnly: boolean;
};

type Item<T> = T extends Array<infer P> ? P : T;

export type HeadingWithAnchors = Heading & {
    children: (Item<Heading['children']> | Anchor)[]
};

export default asyncAstLoader<Options, Root>(async function({ ast  }) {
    const { supportGithubAnchors = false } = this.getOptions();
    const uniqueId = UniqueId();
    const slugger = new GithubSlugger();

    (selectAll<HeadingWithAnchors>('heading', ast)).forEach((node) => {
        const title = select<Text>('text', node) as Text;
        const anchors = selectAll<Anchor>('heading-anchor', node) as Anchor[];

        const defined = anchors.map((anchor) => anchor.value);
        const generated = [];

        uniqueId.add(...defined);

        if (!defined.length) {
            generated.push(slugify(title.value, {
                lower: true,
                remove: /[*+~.()'"!:@`ь]/g,
            }));
        }

        if (supportGithubAnchors) {
            generated.push(slugger.slug(title.value));
        }

        node.children.push(...uniq(extract(generated, defined)).map(uniqueId).map(anchor));
    });
}, 'generate-anchors');