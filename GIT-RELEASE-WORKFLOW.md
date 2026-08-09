# Git Release Workflow

## Recommended branches
- `main` — stable/deployed site
- `develop` — future development/testing

## Recommended release flow
1. Work on `develop`.
2. Test the update.
3. Create a release ZIP.
4. Merge `develop` into `main`.
5. Tag the release, e.g. `v13.1.0`.
6. GitHub Pages deploys `main`.

## Creating a tag from GitHub Desktop / command line
Command-line example:

```bash
git checkout main
git pull
git tag -a v13.1.0 -m "TBOP 13.1.0 W8DRZ Legacy Release"
git push origin v13.1.0
```

## Rollback concept
The release tag plus the pre-release ZIP gives two independent rollback paths.
