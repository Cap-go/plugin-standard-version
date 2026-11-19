import command from 'commit-and-tag-version/command.js'

if (command == null || command.argv === undefined) {
  throw new Error('commit-and-tag-version/command.js did not export argv')
}

console.log('command import ok')
