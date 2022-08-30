export function uniq(items: string[]) {
    return [ ...new Set(items) ];
}

export function extract(from: any[], list: any[]) {
    return from.filter(value => !list.includes(value));
}

export function UniqueId() {
    const ids: Record<string, number> = {};
    const modifier = function uniqueId(id: string): string {
        if (ids[id]) {
            return uniqueId(id + ids[id]++);
        }

        ids[id] = 1;

        return id;
    };

    modifier.add = (...keys: string[]) => {
        keys.forEach((id) => {
            ids[id] = (ids[id] || 0) + 1;
        });
    }

    return modifier;
}