# Praxis Wealth v1.0.3 - Rollback Procedure

## Protected checkpoint

- Tag: praxis-v1.0.3-stable-offline
- Commit: bd92445cd7b2f8f613604ba3e1fe37cfb004179e

The protected tag must never be moved, deleted or force-pushed.

## Open rollback version safely

git fetch origin --tags --prune
git switch -c recovery/praxis-v1.0.3 praxis-v1.0.3-stable-offline

## Validate rollback version

npm ci
npm run check:build
npx expo-doctor

## Return to development

git switch master
git pull --ff-only origin master

Do not erase user financial data during a source rollback.
