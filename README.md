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
