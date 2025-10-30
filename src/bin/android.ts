const regexAndroid = /private\sfinal\sString\spluginVersion\s=\s"(.*)";/g

export function readVersion(contents) {
  const vString = contents.match(regexAndroid)
  const version = vString && vString[0] ? vString[0].replace(regexAndroid, '$1') : null
  return version
}

export function writeVersion(contents, version) {
  const newContent = contents.replace(
    regexAndroid,
    `private final String pluginVersion = "${version}";`,
  )
  return newContent
}
