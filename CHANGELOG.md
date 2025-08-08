# Change Log

All notable changes to the "autoit3-debug" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## Added

- Support for running AutoIt with the ErrorStdOut argument via the launch configuration file.

## [1.2.1] - 2024-10-01

### Fixed

- Output to debug console was wrong for some chars, when comparing to known SciTE console output

## [1.2.0] - 2024-07-27

### Added

- Support for console output text color based on leading character, via setting "autoit3.output.colors"

## [1.1.0] - 2024-04-10

### Added

- Support for script arguments in the launch configuration file.

## [1.0.1] - 2023-12-28

### Fixed

- Debugging au3 file without an existing debug configuration would result in a missing debugger for AutoIt message.

## [1.0.0] - 2023-01-29

### Added

- Running AutoIt3 scripts via vscode run and debug system with output.

[Unreleased]: https://github.com/genius257/vscode-autoit3-debug/compare/1.8.6...HEAD
[1.2.1]: https://github.com/genius257/vscode-autoit3-debug/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/genius257/vscode-autoit3-debug/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/genius257/vscode-autoit3-debug/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/genius257/vscode-autoit3-debug/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/genius257/vscode-autoit3-debug/releases/tag/1.0.0
