# Individual PNG to SVG assets

Converted the 60 transparent PNG assets supplied in `individual_png.zip` with the installed VTracer Python binding (0.6.15).

- `png/`: original supplied PNG files, kept unchanged.
- `svg/`: standard VTracer conversion.
- `svg-smooth/`: smoother and smaller conversion for comparison.
- `cleaned/54_parking-lot.png`: vectorization-only copy with the printed `P` removed from the parking sign. The original in `png/` is unchanged.
- `preview.html`: side-by-side PNG, standard SVG, and smooth SVG comparison page.
- `manifest.json`: source-to-output map and asset categories.

The source PNGs contain partial-alpha antialias pixels. This VTracer Windows binding crashes on partial-alpha input, so the conversion script thresholds only the tracing copy at alpha 72; transparent PNG sources remain intact and the SVG canvas remains transparent. The smooth preset uses VTracer's spline mode with higher corner smoothing, stronger speckle filtering, fewer color levels, and longer simplification segments. On this set it reduced the aggregate SVG size from 6.53 MB to about 1.10 MB (83%). The three sample files compared in the preview show representative size reduction.

Run from the project root with `py scripts/convert-individual-png-vtracer.py` to regenerate both SVG versions and the gallery. It expects the supplied ZIP under the user's Downloads folder and Python packages `vtracer`, Pillow, OpenCV, and NumPy.
