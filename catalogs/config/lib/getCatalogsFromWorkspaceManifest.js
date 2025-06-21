import { PnpmError } from '@pnpm/error'

/**
 * @typedef {Object<string, unknown>} Catalogs
 * A map of catalog names to catalog configurations (structure depends on PNPM implementation).
 */

/**
 * @typedef {Object} WorkspaceManifest
 * @property {unknown} [catalog] - The default catalog definition.
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
