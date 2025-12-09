import { existsSync, readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import standardVersion from 'commit-and-tag-version'
import command from 'commit-and-tag-version/command'
import merge from 'merge-deep'
import * as android from './android'
import * as ios from './ios'

async function findByExtension(dir: string, ext: string): Promise<string[]> {
  const matchedFiles = []

  const files = await readdir(dir)

  for (const file of files) {
    const fileExt = extname(file)

    if (fileExt === `.${ext}`) {
      const noExt = file.replace(fileExt, '')
      matchedFiles.push(noExt)
    }
  }

  return matchedFiles
}

async function findPathPlugin(): Promise<{ iosPath: string, androidPath: string }> {
  // iOS path
  let iosPath = ''
  const oldIosDir = './ios/Plugin'
  const newIosDir = './ios/Sources'

  if (existsSync(oldIosDir)) {
    const mFiles = await findByExtension(oldIosDir, 'm')
    const swiftFiles = await findByExtension(oldIosDir, 'swift')
    let fileName = ''

    if (mFiles && mFiles[0]) {
      fileName = mFiles[0]
    }
    else if (swiftFiles.length > 0) {
      const pluginFile = swiftFiles.find(file => file.toLowerCase().endsWith('plugin'))
      fileName = pluginFile || swiftFiles[0]
    }

    if (!fileName) {
      throw new Error('No .m or Plugin.swift file found in ios/Plugin, cannot guess your plugin name')
    }

    iosPath = join(oldIosDir, `${fileName}.swift`)
  }
  else if (existsSync(newIosDir)) {
    const pluginDirs = await readdir(newIosDir)
    const pluginDir = pluginDirs.find(dir => dir.toLowerCase().includes('plugin'))
    if (!pluginDir) {
      throw new Error('Plugin directory not found in ios/Sources')
    }
    const fullPluginDir = join(newIosDir, pluginDir)
    const swiftFiles = await findByExtension(fullPluginDir, 'swift')
    if (!swiftFiles || swiftFiles.length === 0) {
      throw new Error(`Swift files not found in ${fullPluginDir}`)
    }
    const pluginFile = swiftFiles.find(file => file.toLowerCase().endsWith('plugin')) || swiftFiles[0]
    iosPath = join(fullPluginDir, `${pluginFile}.swift`)
  }
  else {
    throw new Error('iOS plugin directory not found')
  }

  // Android path
  const fileAndroid = './android/build.gradle'
  const contentsAndroid = readFileSync(fileAndroid, 'utf8')
  // Support both old (namespace "...") and new (namespace = "...") Gradle syntax
  const resultMatchAndroid = contentsAndroid.match(/namespace\s*(?:=\s*)?"(.*)"/g)
  if (!resultMatchAndroid || !resultMatchAndroid[0]) {
    throw new Error('Namespace not found in android/build.gradle, cannot guess your plugin name')
  }
  const resultAndroid
    = resultMatchAndroid && resultMatchAndroid[0]
      ? resultMatchAndroid[0].replace(/namespace\s*(?:=\s*)?"(.*)"/g, '$1')
      : null
  const foldersPath = resultAndroid.split('.').join('/')
  const fileName = iosPath.split('/').pop()?.replace('.swift', '')
  const androidPath = `./android/src/main/java/${foldersPath}/${fileName}.java`

  return { iosPath, androidPath }
}

const baseConfig = {
  noVerify: true,
  tagPrefix: '',
  packageFiles: [
    {
      filename: './package.json',
      type: 'json',
    },
  ],
  bumpFiles: [
    {
      filename: '',
      updater: android,
    },
    {
      filename: '',
      updater: ios,
    },
    {
      filename: './package.json',
      type: 'json',
    },
    {
      filename: './package-lock.json',
      type: 'json',
    },
  ],
}

async function run() {
  try {
    // merge base config with user config
    const { iosPath, androidPath } = await findPathPlugin()
    baseConfig.bumpFiles[0].filename = androidPath
    baseConfig.bumpFiles[1].filename = iosPath
    const finalConfig = merge(command.argv, baseConfig)
    await standardVersion(finalConfig)
  }
  catch (error) {
    console.error(error)
    throw error
  }
}

run()
