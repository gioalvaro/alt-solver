import es from './es.json';

type Bundle = Record<string, string>;
const bundles: Record<string, Bundle> = { es: es as Bundle };

let active: Bundle = bundles.es!;

export function setLocale(locale: string): void {
  const lang = (locale || 'es').slice(0, 2);
  active = bundles[lang] ?? bundles.es!;
}

export function t(key: string): string {
  return active[key] ?? key;
}
