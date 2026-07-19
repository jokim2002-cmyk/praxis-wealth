const fs = require("fs");
const path = require("path");

function fail(message) {
  console.error(`BUILD CHECK FAILED: ${message}`);
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const eas = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8"));
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

if (app.expo.name !== "Praxis Wealth") fail("Expo app name is not Praxis Wealth");
if (app.expo.slug !== "praxis-wealth") fail("Expo slug is not praxis-wealth");
if (app.expo.android?.package !== "com.emergent.aiwealthmanager.oaa4sb") fail("Android package changed unexpectedly");
if (eas.build?.preview?.android?.buildType !== "apk") fail("preview profile is not configured for APK");
if (!eas.build?.preview?.env?.EXPO_PUBLIC_BACKEND_URL) fail("preview backend URL is missing");
if (pkg.scripts?.preinstall !== "node ./scripts/cmd-guard.js --preinstall") fail("Windows-safe preinstall command is missing");
for (const rel of ["assets/images/icon.png", "assets/images/adaptive-icon.png", "assets/images/splash-image.png"]) {
  if (!fs.existsSync(path.join(root, rel))) fail(`${rel} is missing`);
}
console.log("build configuration checks passed");
