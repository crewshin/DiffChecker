# DiffChecker

![](https://github.com/crewshin/DiffChecker/blob/e3f423cf5dc8a50f98c83b005ab028f1e0ecec57/DiffChecker.png)

Compare two pieces of text side by side on your desktop. Paste the original on the left and the modified version on the right to see changed lines and words immediately.

## Your text stays private

Unlike web based diff tools, this one keeps all data private. The text you paste or open is not uploaded to a server or sent to a comparison service. No account is needed. No analytics. No network calls. Nothing. Simple, free, open source tool.

The editors start blank each time you launch the app, and comparison text is not saved automatically. If you want to keep a record, you can choose to export a patch file to your computer.

## Download

Get the [latest release](https://github.com/crewshin/DiffChecker/releases/latest), or browse [all releases](https://github.com/crewshin/DiffChecker/releases).

Choose the download for your computer:

| System | Download format |
| --- | --- |
| macOS | `.dmg` for Apple Silicon or Intel |
| Windows | `.exe` or `.msi` |
| Linux | `.AppImage`, `.deb`, or `.rpm` |

Current releases are unsigned development builds. On MacOS, you might need to run `xattr -cr /Applications/DiffChecker.app` to get it to launch.

## What you can do

- Paste or edit text in either pane and see line and word changes as you type.
- Open a local text file into either pane, or swap the two sides.
- Jump between changes, wrap long lines, or hide unchanged lines.
- Highlight TypeScript, JavaScript, JSON, HTML, CSS, and Markdown syntax.
- Export the comparison as a unified `.patch` file.
- Use light mode, dark mode, or the system theme.

Text file imports are limited to files up to 2 MB to keep editing responsive.
