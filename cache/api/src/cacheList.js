import fs from 'node:fs'
import getRegistryName from 'encode-registry'
import { glob } from 'tinyglobby'

/**
 * @typedef {Object} CacheOptions
 * @property {string} cacheDir - The base directory of the cache.
 * @property {string} [registry] - Optional registry name to filter by.
 * @property {boolean} [registries] - Optional flag to indicate if only registries should be listed.
 */

/**
 * List all registry directories in the cache.
 *
 * @param {CacheOptions} opts
 * @returns {Promise<string>}
 */
export async function cacheListRegistries(opts) {
  return fs.readdirSync(opts.cacheDir).sort().join('\n')
}

/**
 * List all metadata JSON files in the cache, optionally filtered by package name.
 *
 * @param {CacheOptions} opts
 * @param {string[]} filter - List of package names to filter by.
 * @returns {Promise<string>}
 */
export async function cacheList(opts, filter) {
  const metaFiles = await findMetadataFiles(opts, filter)
  return metaFiles.sort().join('\n')
}

/**
 * Find metadata JSON files in the cache matching the given filters.
 *
 * @param {{ cacheDir: string, registry?: string }} opts
 * @param {string[]} filter - List of package names to filter by.
 * @returns {Promise<string[]>}
 */
export async function findMetadataFiles(opts, filter) {
  const prefix = opts.registry ? `${getRegistryName(opts.registry)}` : '*'
  const patterns = filter.length
    ? filter.map((f) => `${prefix}/${f}.json`)
    : [`${prefix}/**`]

  const metaFiles = await glob(patterns, {
    cwd: opts.cacheDir,
    expandDirectories: false,
  })
  return metaFiles
}
