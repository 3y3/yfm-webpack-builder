import { load } from 'js-yaml';

export default function(content: string) {
    return load(content);
};
