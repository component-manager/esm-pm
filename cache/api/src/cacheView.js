import fs from 'fs'
import path from 'path'
import { glob } from 'tinyglobby'
import { getIndexFilePathInCafs } from '@pnpm/store.cafs'
// import { type PackageMeta } from '@pnpm/npm-resolver'
import getRegistryName from 'encode-registry'

/**
 * @typedef {Object} CachedVersions
 * @property {string[]} cachedVersions - Versions that are cached.
 * @property {string[]} nonCachedVersions - Versions that are not cached.
 * @property {string} [cachedAt] - Date string when the metadata was cached.
 * @property {Record<string, string>} distTags - Distribution tags for the package.
 */

/**
 * @typedef {Object} PackageMeta
 * @property {Record<string, {
 *   dist: { integrity?: string },
 *   name: string,
 *   version: string
 * }>} versions
 * @property {string} [cachedAt]
 * @property {Record<string, string>} ['dist-tags']
 */

/**
 * @param {{ cacheDir: string, storeDir: string, registry?: string }} opts
 * @param {string} packageName
 * @returns {Promise<string>}
 */
export async function cacheView(opts, packageName) {
  const prefix = opts.registry ? `${getRegistryName(opts.registry)}` : '*'
  const metaFilePaths = (await glob(`${prefix}/${packageName}.json`, {
    cwd: opts.cacheDir,
    expandDirectories: false,
  })).sort()

  /** @type {Record<string, CachedVersions>} */
  const metaFilesByPath = {}

  for (const filePath of metaFilePaths) {
    /** @type {PackageMeta} */
    const metaObject = JSON.parse(fs.readFileSync(path.join(opts.cacheDir, filePath), 'utf8'))

    const cachedVersions = []
    const nonCachedVersions = []

    for (const [version, manifest] of Object.entries(metaObject.versions)) {
      if (!manifest.dist.integrity) continue
      const indexFilePath = getIndexFilePathInCafs(opts.storeDir, manifest.dist.integrity, `${manifest.name}@${manifest.version}`)
      if (fs.existsSync(indexFilePath)) {
        cachedVersions.push(version)
      } else {
        nonCachedVersions.push(version)
      }
    }

    let registryName = filePath
    while (path.dirname(registryName) !== '.') {
      registryName = path.dirname(registryName)
    }

    metaFilesByPath[registryName.replaceAll('+', ':')] = {
      cachedVersions,
      nonCachedVersions,
      cachedAt: metaObject.cachedAt ? new Date(metaObject.cachedAt).toString() : undefined,
      distTags: metaObject['dist-tags'],
    }
  }

  return JSON.stringify(metaFilesByPath, null, 2)
}
