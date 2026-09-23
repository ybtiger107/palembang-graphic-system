# Public Release Checklist

Use this before the first public GitHub push and before later releases that add new source or reference material.

## Source integrity

```bash
python3 scripts/verify.py
git status --short
git diff --check
```

Confirm that `source/Palembang.fig`, its extracted members, canonical PNG renders, reference photographs, and the specification still match the preserved hashes.

## Visual-rights check

This repository intentionally separates the MIT code license from visual materials.

Before publishing, confirm that you are allowed to publicly distribute:

- the photograph of the physical painting;
- the depicted artwork itself;
- the Figma source and derived graphic design;
- the canonical PNG renders in `assets/canonical/png/`;
- any visible signature, mark, or third-party material in the photographs.

If permission for the physical artwork/reference photos is uncertain, keep the canonical Figma/specification in the project as appropriate but remove the affected `reference/` files from the public repository until rights are clarified. Do not replace the licensing text with a permissive visual license unless the relevant rights holder can grant it.

## Privacy / metadata check

Review photographs and source metadata for anything you do not want public. The supplied context photograph includes the physical surroundings of the artwork; decide intentionally whether that context belongs in the public repository.

## Repository review

```bash
git log --oneline --decorate -n 5
git show --stat --oneline HEAD
find . -maxdepth 3 -type f | sort
```

Confirm that generated exports, temporary files, credentials, environment files, and unrelated personal material are absent.

## Remote destination

Create or select the intended GitHub repository, then inspect the exact remote before pushing:

```bash
git remote -v
```

Only push after confirming the destination and branch.
