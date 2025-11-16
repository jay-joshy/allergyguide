# OIT Calculator

## Overview

The OIT (Oral Immunotherapy) Calculator is a web-based tool designed to generate customizable, evidence-based protocols for oral immunotherapy treatment of IgE-mediated food allergies. It helps clinicians create patient-specific dosing schedules with automatic dilution calculations, Food A → Food B transitions, and built-in validation checks.

## Features

### Core Functionality

1. **Multiple Dosing Strategies**
   - Standard (11 steps): 1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300 mg
   - Slow (19 steps): 0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220, 260, 300 mg
   - Rapid (9 steps): 1, 2.5, 5, 10, 20, 40, 80, 160, 300 mg

2. **Flexible Food Selection**
   - Searchable database of foods with protein content
   - Custom food creation
   - Pre-built protocol templates
   - Support for both solid and liquid foods

3. **Dilution Strategies**
   - Initial dilution only (switches to direct once measurable)
   - Dilution throughout entire protocol
   - No dilutions (direct dosing only)

4. **Food A → Food B Transitions**
   - Automatic transition point calculation
   - Threshold-based switching (e.g., powder → whole food)
   - Maintains consistent protein dosing across transition

5. **Automatic Dilution Calculations**
   - Optimizes mix food amount and water volume
   - Ensures servings meet minimum threshold
   - Respects measurement constraints (scale/syringe resolution)
   - Handles solid-in-liquid vs liquid-in-liquid dilutions differently

6. **Real-time Validation**
   - Red (critical) warnings for dangerous/invalid configurations
   - Yellow warnings for suboptimal but acceptable settings
   - Step-specific error messages
   - Protein mismatch detection

7. **Editable Protocols**
   - Modify target protein amounts
   - Adjust daily doses
   - Change dilution parameters
   - Add/remove steps dynamically
   - Change food properties (type, concentration)

8. **Export Capabilities**
   - ASCII text export for EMR (Electronic Medical Records)
   - PDF generation (placeholder for future implementation)

## Usage

### Embedding in Zola

To use the calculator in a Zola markdown page:

```markdown
{{ oit_calculator() }}
```

The shortcode will render the complete calculator interface.

### Browser Compatibility

- Requires ES2017+ support
- Modern browsers (Chrome 58+, Firefox 52+, Safari 10.1+, Edge 79+)
- No IE11 support

## Troubleshooting

### Calculator not loading

1. Check browser console for errors
2. Verify decimal.js is loaded: `typeof Decimal !== 'undefined'`
3. Verify fuzzysort is loaded: `typeof fuzzysort !== 'undefined'`
4. Check that JSON files are accessible

### Compilation errors

- Ensure TypeScript is installed
- Check TypeScript version: `tsc --version` (should be 3.0+)
- Clear build artifacts: `rm static/js/oit_calculator.js`

### Search not working

- Check JSON files load correctly
- Verify fuzzysort CDN is accessible
- Check browser console for network errors

### Styling issues

- Ensure SCSS is compiled to CSS
- Check that custom properties are defined
- Verify `--oit-*` CSS variables in browser inspector
