type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

/**
 * Renders structured data as a plain script text node. The payload is
 * JSON-encoded and `<` is escaped so the closing script tag cannot appear in
 * the data. This avoids `dangerouslySetInnerHTML`.
 */
export function DocsJsonLd({ data }: { data: { [key: string]: JsonLdValue } }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script type="application/ld+json">{json}</script>;
}
