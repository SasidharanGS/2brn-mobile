// Expo config plugin: wire local release signing for the Android `release` variant.
//
// The CNG template (android/app/build.gradle) signs `release` with the shared *debug*
// keystore. Since `android/` is git-ignored and regenerated on every prebuild, we can't
// hand-edit it — so this plugin patches the generated build.gradle at prebuild time to:
//
//   1. add a `release` signingConfig that reads a git-ignored `credentials/keystore.properties`
//      (kept *outside* android/ so a clean prebuild can't wipe it), and
//   2. point the `release` buildType at it — but only when that file exists, otherwise it
//      falls back to debug signing so contributors and CI still build with no keystore.
//
// See docs/BUILD.md → "Release hardening". The keystore + its passwords never enter git.
const { withAppBuildGradle } = require('@expo/config-plugins')

// Marks the end of the template's `debug` signingConfig; we insert the `release` one after it.
const DEBUG_SIGNING_BLOCK = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }`

const RELEASE_SIGNING_BLOCK = `
        // Added by plugins/withReleaseSigning.js — local upload key from a git-ignored
        // credentials/keystore.properties (outside android/, survives a clean prebuild).
        release {
            def kpFile = rootProject.file("../credentials/keystore.properties")
            if (kpFile.exists()) {
                def kp = new Properties()
                kpFile.withInputStream { kp.load(it) }
                storeFile rootProject.file("../credentials/" + kp['storeFile'])
                storePassword kp['storePassword']
                keyAlias kp['keyAlias']
                keyPassword kp['keyPassword']
            }
        }`

// The template's release buildType signs with debug; swap to release when the key exists.
const RELEASE_BUILDTYPE_SIGNING = 'signingConfig signingConfigs.debug'
const RELEASE_BUILDTYPE_SIGNING_NEW =
  'signingConfig rootProject.file("../credentials/keystore.properties").exists() ? signingConfigs.release : signingConfigs.debug'

function patchBuildGradle(contents) {
  if (contents.includes('signingConfigs.release')) {
    return contents // already patched (idempotent within a prebuild)
  }
  if (!contents.includes(DEBUG_SIGNING_BLOCK)) {
    throw new Error(
      '[withReleaseSigning] could not find the debug signingConfig block in build.gradle — ' +
        'the Expo/RN template may have changed; update plugins/withReleaseSigning.js.'
    )
  }
  let patched = contents.replace(DEBUG_SIGNING_BLOCK, DEBUG_SIGNING_BLOCK + RELEASE_SIGNING_BLOCK)

  // Only the `release` buildType uses `signingConfigs.debug`; debug uses it too, so replace
  // the occurrence inside the release block specifically (it's preceded by the template's
  // "Caution!" comment), to avoid touching the debug buildType.
  const releaseSigningWithComment = `// see https://reactnative.dev/docs/signed-apk-android.\n            ${RELEASE_BUILDTYPE_SIGNING}`
  if (!patched.includes(releaseSigningWithComment)) {
    throw new Error(
      '[withReleaseSigning] could not find the release buildType signingConfig line — ' +
        'the Expo/RN template may have changed; update plugins/withReleaseSigning.js.'
    )
  }
  patched = patched.replace(
    releaseSigningWithComment,
    `// see https://reactnative.dev/docs/signed-apk-android.\n            ${RELEASE_BUILDTYPE_SIGNING_NEW}`
  )
  return patched
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = patchBuildGradle(cfg.modResults.contents)
    return cfg
  })
}
