# AltSolver — Logo assets

Source: `logo.svg` (copy of `variant-b-sigma-star.svg`).

## Files

| File | Size | Uso |
|---|---|---|
| `logo.svg` | vector | source de verdad |
| `logo-32.png` | 32×32 | favicon / Marketplace search results |
| `logo-64.png` | 64×64 | Marketplace listing card |
| `logo-128.png` | 128×128 | Hero del detalle del Marketplace + manifest `appsscript.json` |
| `variant-a-calculator.svg` | vector | descartada — minimal calculator |
| `variant-c-feasible-region.svg` | vector | descartada — mini LP plot |

## Hosting

Una vez que GitHub Pages esté habilitado en este repo (Settings → Pages → Source: main / `/docs`), los PNGs van a quedar disponibles en:

- `https://gioalvaro.github.io/alt-solver/marketplace/logo/logo-32.png`
- `https://gioalvaro.github.io/alt-solver/marketplace/logo/logo-64.png`
- `https://gioalvaro.github.io/alt-solver/marketplace/logo/logo-128.png`

Cuando esto se confirme, actualizar `appsscript.json` para que `addOns.common.logoUrl` apunte al `logo-128.png` hosteado.

## Regenerar PNGs desde el SVG

Si se modifica `logo.svg`, regenerar los PNGs con `rsvg-convert` (`brew install librsvg`):

```bash
cd docs/marketplace/logo
for size in 32 64 128; do
  rsvg-convert -w $size -h $size logo.svg -o logo-$size.png
done
```

Alternativas si no tenés `rsvg-convert`:

```bash
# ImageMagick
for size in 32 64 128; do
  convert -background none -resize ${size}x${size} logo.svg logo-${size}.png
done

# macOS sin nada extra (calidad menor)
for size in 32 64 128; do
  qlmanage -t -s $size -o . logo.svg
  mv logo.svg.png logo-${size}.png
done
```
