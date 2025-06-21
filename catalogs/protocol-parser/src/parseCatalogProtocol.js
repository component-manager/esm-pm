const CATALOG_PROTOCOL = 'catalog:'

/**
 * Parses a package.json dependency specifier using the `catalog:` protocol.
 *
 * Returns `null` if the specifier does not start with `'catalog:'`.
 * Returns `'default'` if the specifier is exactly `'catalog:'`.
 *
 * @param {string} bareSpecifier - The dependency specifier string to parse.
 * @returns {string | 'default' | null} The parsed catalog name, `'default'`, or `null`.
 */
export function parseCatalogProtocol(bareSpecifier) {
  if (!bareSpecifier.startsWith(CATALOG_PROTOCOL)) {
    return null
  }

  const catalogNameRaw = bareSpecifier.slice(CATALOG_PROTOCOL.length).trim()

  // Allow a specifier of 'catalog:' to be a short-hand for 'catalog:default'.
  const catalogNameNormalized = catalogNameRaw === '' ? 'default' : catalogNameRaw

  return catalogNameNormalized
}
