import { PnpmError } from '@pnpm/error'

/**
 * A catalog of dependency versions.
 * 
 * Each key is a dependency name, and the value is a string version or `undefined`.
 *
 * @typedef {Object<string, (string | undefined)>} Catalog
 */

/**
 * Catalogs parsed from the pnpm-workspace.yaml file.
 * 
 * - The default catalog can be specified in one of two ways:
 *   1. Using the top-level `catalog` field.
 *   2. By defining an explicitly named `'default'` catalog under the `catalogs` map.
 *
 * It's an error to define both; the manifest parser will throw in that case.
 *
 * @typedef {Object<string, (Catalog | undefined)> & { default?: Catalog }} Catalogs
 */


/**
 * @typedef {Object} WorkspaceManifest
 * @property {Catalog} [catalog] - The default catalog definition.
 * @property {Catalogs} [catalogs] - A map of named catalogs.
 */

/**
 * Extracts and normalizes catalog definitions from a workspace manifest.
 * If the manifest is undefined, returns an empty catalog object.
 * 
 * @param {Pick<WorkspaceManifest, 'catalog' | 'catalogs'> | undefined} workspaceManifest
 * @returns {Catalogs}
 */
export function getCatalogsFromWorkspaceManifest(workspaceManifest) {
  if (workspaceManifest == null) {
    return {}
  }

  checkDefaultCatalogIsDefinedOnce(workspaceManifest)

  return {
    default: workspaceManifest.catalog,
    ...workspaceManifest.catalogs,
  }
}

/**
 * Ensures that the 'default' catalog is defined in only one place:
 * either `catalog` or `catalogs.default`, but not both.
 *
 * @param {Pick<WorkspaceManifest, 'catalog' | 'catalogs'>} manifest
 * @throws {PnpmError} If 'default' is defined in both locations.
 * @returns {void}
 */
export function checkDefaultCatalogIsDefinedOnce(manifest) {
  if (manifest.catalog != null && manifest.catalogs?.default != null) {
    throw new PnpmError(
      'INVALID_CATALOGS_CONFIGURATION',
      "The 'default' catalog was defined multiple times. Use the 'catalog' field or 'catalogs.default', but not both."
    )
  }
}
