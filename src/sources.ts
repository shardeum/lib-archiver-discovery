import * as fs from 'fs'
import { Archiver, Config } from './types'
import { downloadAndSaveJsonFile } from './utils'

export const fetchArchiverListFromEnv = (opts?: { customEnvName?: string }): Archiver[] => {
  const envName = opts?.customEnvName || 'ARCHIVER_INFO'
  // eslint-disable-next-line security/detect-object-injection
  const archiverEnv = process.env[envName]
  if (!archiverEnv) {
    console.log(`Environment variable ${envName} is not defined`)
    return []
  }
  if (archiverEnv.length === 0) {
    console.log(`Environment variable ${envName} is empty`)
    return []
  }

  const archivers = archiverEnv.split(',').map((archiver) => archiver.trim())
  if (archivers.length === 0) {
    console.log(`Environment variable ${envName} contains no archivers`)
    return []
  }

  return archivers.map((archiver) => {
    const [ip, port, publicKey] = archiver.split(':')
    const archiverObj: Archiver = { ip, port: parseInt(port, 10), publicKey }
    return archiverObj
  })
}

export const fetchArchiverListFromConfig = async (config: Config): Promise<Archiver[]> => {
  if (!config.archivers || config.archivers.length === 0) {
    console.log(`Archivers not found in config`)
    return []
  }

  return config.archivers
}

const readArchiverListFromLocalCache = async (filePath: string): Promise<Archiver[]> => {
  let jsonData = ''
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    jsonData = fs.readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.log(`Unable to read from local config file: ${filePath} err: ${err}}`)
    return []
  }
  const parsedData = JSON.parse(jsonData)
  const archiverList: Archiver[] = parsedData
  return archiverList
}

export const fetchArchiverListFromRemoteOrCache = async (
  config: Config,
  opts?: { customCacheFilePath?: string }
): Promise<Archiver[]> => {
  if (!config.archiversUrl) {
    console.log(`Archivers URL not found in config`)
    return []
  }
  const cacheFilePath = opts?.customCacheFilePath || './archiver_seed_list.json'
  await downloadAndSaveJsonFile(config.archiversUrl, cacheFilePath)
  return readArchiverListFromLocalCache(cacheFilePath)
}
