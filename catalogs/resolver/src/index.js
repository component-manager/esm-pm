import { PnpmError } from '@pnpm/error'
import { parseCatalogProtocol } from '@pnpm/catalogs.protocol-parser'

/**
 * @typedef {Object} Catalog
 * @property {Object<string, (string | undefined)>} [dependencyName] - A mapping from dependency names to specifiers.
 */

/**
 * @typedef {Object<string, (Catalog | undefined)> & { default?: Catalog }} Catalogs
 * A mapping of catalog names to catalog objects, including an optional 'default'.
 */

/**
 * @typedef {Object} WantedDependency
 * @property {string} bareSpecifier - The full specifier, e.g., 'catalog:default'.
 * @property {string} alias - The dependency name being referenced.
 */

/**
 * @typedef {Object} CatalogResolution
 * @property {string} catalogName - The name of the catalog used.
 * @property {string} specifier - The resolved specifier to use.
 */

/**
 * @typedef {Object} CatalogResolutionFound
 * @property {'found'} type
 * @property {CatalogResolution} resolution
 */

/**
 * @typedef {Object} CatalogResolutionMisconfiguration
 * @property {'misconfiguration'} type
 * @property {PnpmError} error
 * @property {string} catalogName
 */

/**
 * @typedef {Object} CatalogResolutionUnused
 * @property {'unused'} type
 */

/**
 * @typedef {CatalogResolutionFound | CatalogResolutionMisconfiguration | CatalogResolutionUnused} CatalogResolutionResult
 */

/**
 * @typedef {(wantedDependency: WantedDependency) => CatalogResolutionResult} CatalogResolver
 */

/**
 * Resolves a wanted dependency using the `catalog:` protocol from the given catalogs.
 *
 * @param {Catalogs} catalogs
 * @param {WantedDependency} wantedDependency
 * @returns {CatalogResolutionResult}
 */
export function resolveFromCatalog(catalogs, wantedDependency) {
  const catalogName = parseCatalogProtocol(wantedDependency.bareSpecifier)

  if (catalogName == null) {
    return { type: 'unused' }
  }

  const catalogLookup = catalogs[catalogName]?.[wantedDependency.alias]
  if (catalogLookup == null) {
    return {
      type: 'misconfiguration',
      catalogName,
      error: new PnpmError(
        'CATALOG_ENTRY_NOT_FOUND_FOR_SPEC',
        `No catalog entry '${wantedDependency.alias}' was found for catalog '${catalogName}'.`
      ),
    }
  }

  if (parseCatalogProtocol(catalogLookup) != null) {
    return {
      type: 'misconfiguration',
      catalogName,
      error: new PnpmError(
        'CATALOG_ENTRY_INVALID_RECURSIVE_DEFINITION',
        `Found invalid catalog entry using the catalog protocol recursively. The entry for '${wantedDependency.alias}' in catalog '${catalogName}' is invalid.`
      ),
    }
  }

  const protocolOfLookup = catalogLookup.split(':')[0]
  if (protocolOfLookup === 'workspace') {
    return {
      type: 'misconfiguration',
      catalogName,
      error: new PnpmError(
        'CATALOG_ENTRY_INVALID_WORKSPACE_SPEC',
        `The workspace protocol cannot be used as a catalog value. The entry for '${wantedDependency.alias}' in catalog '${catalogName}' is invalid.`
      ),
    }
  }

  if (['link', 'file'].includes(protocolOfLookup)) {
    return {
      type: 'misconfiguration',
      catalogName,
      error: new PnpmError(
        'CATALOG_ENTRY_INVALID_SPEC',
        `The entry for '${wantedDependency.alias}' in catalog '${catalogName}' declares a dependency using the '${protocolOfLookup}' protocol. This is not yet supported, but may be in a future version of pnpm.`
      ),
    }
  }

  return {
    type: 'found',
    resolution: {
      catalogName,
      specifier: catalogLookup,
    },
  }
}

/**
 * @template T
 * @typedef {Object} CatalogResultMatcher
 * @property {(result: CatalogResolutionFound) => T} found
 * @property {(result: CatalogResolutionMisconfiguration) => T} misconfiguration
 * @property {(result: CatalogResolutionUnused) => T} unused
 */

/**
 * Pattern matches a `CatalogResolutionResult` by its `type`.
 *
 * @template T
 * @param {CatalogResolutionResult} result
 * @param {CatalogResultMatcher<T>} matcher
 * @returns {T}
 */
export function matchCatalogResolveResult(result, matcher) {
  switch (result.type) {
    case 'found': return matcher.found(result)
    case 'misconfiguration': return matcher.misconfiguration(result)
    case 'unused': return matcher.unused(result)
  }
}
