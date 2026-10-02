# Zagazig 1937 vs Today

Static website: the 1937 Survey of Egypt plan of Zagazig (1:5,000) over modern OpenStreetMap / satellite, with fade and swipe modes, place search and Google Maps links.

- `docs/` – the website (deploy this folder as-is to any static host: GitHub Pages, Netlify, Cloudflare Pages)
- `build_tiles.py` – rebuilds `site/tiles/` from `zagazig_1937.jpg` (needs Pillow). Alignment constants are at the top.
- `zagazig_1937.jpg` – source scan (public domain, Survey of Egypt 1937 via UWM AGSL / Wikimedia Commons)

Preview locally: `cd docs && python3 -m http.server` then open http://localhost:8000
