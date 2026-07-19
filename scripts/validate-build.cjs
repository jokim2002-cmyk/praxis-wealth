const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function fail(message) {
  console.error(`BUILD CHECK FAILED: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function readText(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`missing file ${relativePath}`);
  }
  return fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
  }
}

const packageJson = readJson("package.json");
const appJson = readJson("app.json");
const easJson = readJson("eas.json");
const apiText = readText(path.join("src", "utils", "api.ts"));

if (packageJson.version !== "1.0.3") {
  fail(`package.json version must be 1.0.3; found ${packageJson.version}`);
}
pass("package version 1.0.3");

if (!appJson.expo || appJson.expo.version !== "1.0.3") {
  fail(`app.json Expo version must be 1.0.3`);
}
pass("Expo app version 1.0.3");

if (!appJson.expo.android || Number(appJson.expo.android.versionCode) !== 3) {
  fail(`Android versionCode must be 3`);
}
pass("Android versionCode 3");

if (appJson.expo.android.package !== "com.emergent.aiwealthmanager.oaa4sb") {
  fail(`unexpected Android package ${appJson.expo.android.package}`);
}
pass("Android package");

const preview = easJson.build && easJson.build.preview;
if (!preview) {
  fail("EAS preview profile is missing");
}
if (!preview.android || preview.android.buildType !== "apk") {
  fail("EAS preview profile must build an APK");
}
pass("EAS preview APK profile");

const serializedEas = JSON.stringify(easJson);
if (/EXPO_PUBLIC_BACKEND_URL/i.test(serializedEas)) {
  fail("EAS config still contains EXPO_PUBLIC_BACKEND_URL");
}
if (/preview\.emergentagent\.com/i.test(serializedEas)) {
  fail("EAS config still contains the Emergent preview backend");
}
pass("EAS backend environment removed");

if (/EXPO_PUBLIC_BACKEND_URL/i.test(apiText)) {
  fail("api.ts still reads EXPO_PUBLIC_BACKEND_URL");
}
if (/preview\.emergentagent\.com/i.test(apiText)) {
  fail("api.ts still contains the Emergent preview backend");
}
if (!/const\s+LOCAL_ONLY\s*=\s*true\s*;/.test(apiText)) {
  fail("api.ts is not hard-locked to LOCAL_ONLY");
}
if (!/return\s+localCall\(\)\s*;/.test(apiText)) {
  fail("api.ts does not force localCall()");
}
pass("remote API hard-disabled");
pass("local on-device storage forced");

console.log("BUILD CHECK PASSED: Praxis Wealth offline v1.0.3 is internally consistent");