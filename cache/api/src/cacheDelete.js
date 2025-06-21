import path from 'path'
import fs from 'fs'
import { findMetadataFiles } from './cacheList.js'

export async function cacheDelete ({ cacheDir =  "", registry = "" }, filter: string[]): Promise<string> {
  const metaFiles = await findMetadataFiles({ cacheDir, registry }, filter)
  for (const metaFile of metaFiles) {
    fs.unlinkSync(path.join(cacheDir, metaFile))
  }
  return metaFiles.sort().join('\n')
}
