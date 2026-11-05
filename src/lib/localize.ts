type Tr = Record<string, { title?: string; description?: string } | undefined>;

/**
 * Return the product with its title (and description, if loaded) in the visitor's language,
 * falling back to the original English text. Drops the `tr` field so it isn't sent to the browser.
 */
export function localize<T extends { title: string; description?: string; tr?: unknown }>(p: T, locale: string): Omit<T, "tr"> {
  const { tr, ...rest } = p;
  const t = (tr as Tr | undefined)?.[locale];
  return {
    ...rest,
    title: t?.title || p.title,
    ...(p.description !== undefined ? { description: t?.description || p.description } : {}),
  };
}
