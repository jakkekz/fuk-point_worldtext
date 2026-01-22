# Fuck point_worldtext

A web-based CS2 text overlay generator that creates material files without needing point_worldtext entities.

## Features

- 🎨 Generate custom text overlays with any font
- 🔢 Bulk generate LJ distance numbers (210, 212, 214, etc.)
- 🎯 Multiple alignment options (left, center, right)
- 📐 Various resolution options (256x256 to 4096x4096)
- 🎭 Support for both `csgo_static_overlay` and `csgo_complex` shaders
- 👀 Live preview of your text
- 📦 Download as ZIP with .png and .vmat files ready to use

## How to Use

1. **Configure your settings:**
   - Choose shader type (Static Overlay or Complex)
   - Select content type (Text or LJ Numbers)
   - Enter your text or number range
   - Choose font, alignment, and resolution

2. **Click "Generate & Download":**
   - The tool will create all textures and material files
   - Download the ZIP file automatically

3. **Install in CS2:**
   - Extract the ZIP to your addon's materials folder
   - Example: `content/csgo_addons/your_addon/materials/`
   - The folder structure is already set up correctly

4. **Use in Hammer:**
   - Create an `info_overlay` or `info_overlay_transition`
   - Set material to `materials/fuckpointworldtext/yourtext`

## Why "Fuck point_worldtext"?

The `point_worldtext` entity in CS2 has limitations and can be cumbersome to work with. This tool lets you create custom text overlays as materials, giving you more control and flexibility.

## GitHub Pages

This tool runs entirely in your browser - no server needed! You can use it at:
`https://[your-username].github.io/fuk-point_worldtext/`

## License

Free to use for any purpose. Go wild! 🚀
