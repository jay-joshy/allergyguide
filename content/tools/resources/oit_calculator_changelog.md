+++
title = "CHANGELOG"
date = 2025-12-07
draft = false

[extra]
toc = true
authors = ["Joshua Yu"]
+++

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

- Fixed bug where Undo/Redo operations failed to update text inputs (e.g., Food Name) if the input field was still focused

### Security

## [0.8.0] - 2025-12-07

### Added

- **Protocol**:
  - Dosing Strategies: "Standard" and "Slow" presets
  - Customization: ability to add/remove individual steps and manually edit protein targets or daily amounts directly within the table
  - Transition Logic: automated "Food A to Food B" transitions (e.g., dilute solution to whole food) with customizable protein thresholds
  - Toggle support for both solid and liquid foods with automatic unit conversion
  - Custom notes field that persists to exports

- **Food and protocol**:
  - Foods available from CNF 2015 database with fuzzy-search
  - A few pre-built protocols available with fuzzy-search
  - Support for custom food creation

- **Dilution calculations**:
  - Automatic calculation of amounts/volumes to ensure protein targets are met within measurement constraints
  - Flexible food A strategies: Support for "Initial Dilution," "Dilution Throughout," or "No Dilution" workflows

- **Protocol validation**:
  - Real-time Validation rule set on protocols, red/yellow. Not fully completed yet

- **User experience**:
  - Undo/Redo History: Ctrl+Z / Ctrl+Y for protocol changes

- **Exports and compliance**:
  - Debugging / versioning: commit-hash stamping on PDF footers for version tracking
  - Terms of Use: clickwrap modal before PDF generation
  - ASCII copy-to-clipboard functionality of protocol
