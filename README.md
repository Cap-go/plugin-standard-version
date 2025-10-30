# capacitor-standard-version

Default config for standard-version for capacitor app

use it at builtin replacement of https://www.npmjs.com/package/standard-version

All config from .versionrc, .versionrc.json or .versionrc.js are supported

## Install

`npm i capacitor-plugin-standard-version`

## Usage

Run `npx capacitor-plugin-standard-version` for update main version or `npx capacitor-plugin-standard-version --prerelease alpha` for alpha release for dev branch.

This package will automatically manage your changelog and the version number in 4 places:
- package.json (version key)
- package-lock.json (version key) optional
- Your main iOS file (guessed) search for `private let pluginVersion: String = "(.*)"`
- your main android file (guessed) search for `private final String pluginVersion = "(.*)"`

If not present in your package add:
in Android `private final String pluginVersion = "1.2.3"`
in iOS `private let pluginVersion: String = "1.2.3"`

Add in android then
```java
  @PluginMethod
  public void getPluginVersion(final PluginCall call) {
    try {
      final JSObject ret = new JSObject();
      ret.put("version", this.pluginVersion);
      call.resolve(ret);
    } catch (final Exception e) {
      call.reject("Could not get plugin version", e);
    }
  }
```
And in IOS
```swift
    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": self.pluginVersion])
    }
```
Add a method `getNativeVersion()` in native who will return the version, that useful for Capgo auto-update context when dev want to be certain they don't make a breaking change in production.
Add `getJsVersion()` in JS code to allow user to check the JS version, who can be updated by updater.
Add `checkVersionMatch()` in JS code to allow user to check if the JS and native version match.

Exemple of Github action to do it on every commit in `main` and `development`

```yml
on:
  push:
    branches:
      - main
      - development

jobs:
  bump-version:
    if: '!startsWith(github.event.head_commit.message, ''chore(release):'')'
    runs-on: ubuntu-latest
    name: Bump version and create changelog with standard version
    steps:
      - name: Check out
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
          token: '${{ secrets.PERSONAL_ACCESS_TOKEN }}'
      - name: Git config
        run: |
          git config --local user.name "github-actions[bot]"
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
      - name: Create bump and changelog
        if: github.ref == 'refs/heads/main'
        run: npx capacitor-plugin-standard-version
      - name: Create bump and changelog
        if: github.ref != 'refs/heads/main'
        run: npx capacitor-plugin-standard-version --prerelease alpha
      - name: Push to origin
        run: |
          CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
          remote_repo="https://${GITHUB_ACTOR}:${{ secrets.PERSONAL_ACCESS_TOKEN }}@github.com/${GITHUB_REPOSITORY}.git"
          git pull $remote_repo $CURRENT_BRANCH
          git push $remote_repo HEAD:$CURRENT_BRANCH --follow-tags --tags
```
For this action to work you have to add as env var `PERSONAL_ACCESS_TOKEN` you can create it by following this doc https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
