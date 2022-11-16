import {readdirSync} from 'fs';

interface Locale {
    [key: string]: string | Locale;
}

function flatten(
    object: Locale,
    path: string[] = [],
    acc: Record<string, string> = {},
) {
    for (const [key, value] of Object.entries(object)) {
        if (typeof value === 'object' && value !== null) {
            flatten(value, [...path, key], acc);
        } else {
            acc[path.join('.')] = value;
        }
    }
    return acc;
}

function interpolations(str: string) {
    const VAL_RE = /\{[a-z0-9]+\}/gi;
    const COM_RE = /<[0-9]+>/g;
    return {
        value: [...str.matchAll(VAL_RE)].map(v => v[0]),
        component: [...str.matchAll(COM_RE)].map(v => v[0]),
    };
}

describe('locales', () => {
    let en: Record<string, string>;
    beforeAll(async () => {
        en = flatten(await import('./en/translation.json'));
    });
    const lngs = readdirSync(__dirname, {withFileTypes: true})
        .filter(v => v.isDirectory())
        .map(v => v.name);
    it.each(lngs)('locale %s', async locale => {
        const data = flatten(await import(`./${locale}/translation.json`));
        const keys = new Set([...Object.keys(en), ...Object.keys(data)]);
        for (const key of keys) {
            // expect(data).toHaveProperty(key);
            // expect(en).toHaveProperty(key);
            const lngInterpolations = interpolations(data[key] ?? '');
            const enInterpolations = interpolations(en[key] ?? '');
            // pass key as the first element to get it in the failure message
            expect([key, ...lngInterpolations.value.sort()]).toStrictEqual([
                key,
                ...enInterpolations.value.sort(),
            ]);
            expect([key, ...lngInterpolations.component.sort()]).toStrictEqual([
                key,
                ...enInterpolations.component.sort(),
            ]);
        }
    });
});
