import type { Node } from 'unist';
import type { Processor } from 'unified';
import type { Handler } from './tocst-to-toc';
import { serialize } from './tocst-to-toc';
import { dump } from 'js-yaml';

type Options = {
    handlers?: Record<string, Handler>
};

export default function(this: Processor, options: Options = {}) {
    this.Compiler = compile;

    function compile(root: Node): string {
        const result = serialize(root, {
            handlers : options.handlers || {}
        });

        return dump(result);
    }
}