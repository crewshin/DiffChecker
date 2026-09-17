# DiffChecker

A local desktop app for comparing two pieces of text side by side. Built with React, CodeMirror, Tailwind CSS, and Tauri 2.

## Run

Install dependencies with `pnpm install`, then launch the desktop app with `pnpm tauri dev`. To run just the web interface for development, use `pnpm dev`. Build the web interface with `pnpm build` or package the desktop app with `pnpm tauri build`.

## Features

- Edit or paste text on either side and see line and inline changes immediately.
- Open text files into either editor, swap sides, navigate changes, wrap lines, and collapse unchanged content.
- Syntax highlighting for TypeScript, JavaScript, JSON, HTML, CSS, and Markdown.
- Export a unified `.patch` file. Desktop export uses a native save dialog.
- Light, dark, and system themes. The system theme is the default.
- Start with empty editors on every launch. Text never needs a server; export a patch to keep a copy.

File import is limited to text files under 2 MB to keep editing responsive.

## Releases

A pushed version tag is the source of truth for releases. The workflow in `.github/workflows/release.yml` checks the tag, updates `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src-tauri/Cargo.lock` in each CI checkout, then builds debug installers for macOS (Apple Silicon and Intel), Windows, and Linux. Each build stores its installers as workflow artifacts. A final job uploads them to a draft GitHub Release one at a time, retries temporary upload failures, and publishes the release only when every upload succeeds. Tags can be `v0.1.0`, `v0.2.0`, `v0.3.0`, or the same numbers without the `v` prefix.

After the repository is on GitHub and this workflow is on the default branch, create a release with:

```sh
git tag v0.2.0
git push origin v0.2.0
```

Use `node scripts/set-version.mjs v0.2.0` if you want to update the checked-in version fields before committing and tagging. CI applies the tag version automatically even when those fields still show an older development version. To check a tag without editing files, add `--check`.

The GitHub Actions job uses the repository's built-in `GITHUB_TOKEN`; no release token needs to be added. The builds have no signing configuration.
