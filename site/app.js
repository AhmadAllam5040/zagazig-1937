const $ = id => document.getElementById(id);
const CENTER = [30.5877, 31.5025], ZOOM = 15;

// restore view from #zoom/lat/lng
const h = location.hash.match(/^#(\d+)\/(-?[\d.]+)\/(-?[\d.]+)$/);
const map = L.map('map', {minZoom: 12, maxZoom: 21}).setView(h ? [+h[2], +h[3]] : CENTER, h ? +h[1] : ZOOM);

const base = {
  street: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 21, maxNativeZoom: 19, attribution: '© OpenStreetMap'}),
  sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom: 21, maxNativeZoom: 19, attribution: 'Esri World Imagery'}),
};
base.street.addTo(map);

// 1937 tiles (native z13-18, built by build_tiles.py); zIndex keeps it above whichever basemap is active
const old = L.tileLayer('tiles/{z}/{x}/{y}.webp', {
  minNativeZoom: 13, maxNativeZoom: 18, maxZoom: 21, opacity: 0.6, zIndex: 10,
  attribution: 'Survey of Egypt 1937 (public domain, via UWM/Wikimedia Commons)',
  errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
}).addTo(map);

// --- compare modes ---
const bar = $('swipe'); let mode = 'fade', swipeX = innerWidth / 2;
function clip() {
  const el = old.getContainer(); if (!el) return;
  if (mode !== 'swipe') { el.style.clipPath = ''; return; }
  const x = swipeX - el.getBoundingClientRect().left, B = 1e5;  // container has zero size: polygon in its local px
  el.style.clipPath = `polygon(${x}px ${-B}px,${B}px ${-B}px,${B}px ${B}px,${x}px ${B}px)`;
}
function show() {
  const sw = mode === 'swipe';
  bar.hidden = !sw; bar.style.left = swipeX + 'px'; $('fadeBox').style.display = sw ? 'none' : '';
  old.setOpacity(sw ? 1 : +$('op').value);
  old.getContainer().style.mixBlendMode = $('mul').checked ? 'multiply' : '';
  $('opv').textContent = Math.round($('op').value * 100) + '%';
  clip();
}
function seg(attr, fn) {
  document.querySelectorAll(`[${attr}]`).forEach(b => b.onclick = () => {
    b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(b.getAttribute(attr));
  });
}
seg('data-mode', m => { mode = m; show(); });
seg('data-base', k => { Object.values(base).forEach(l => map.removeLayer(l)); base[k].addTo(map); });
$('op').oninput = $('mul').onchange = show;
map.on('move zoom viewreset', clip);
bar.onpointerdown = e => {
  bar.setPointerCapture(e.pointerId);
  bar.onpointermove = m => { swipeX = m.clientX; bar.style.left = swipeX + 'px'; clip(); };
  bar.onpointerup = () => bar.onpointermove = null;
};

// --- Google Maps links on click ---
function gmPopup(latlng) {
  const q = latlng.lat.toFixed(6) + ',' + latlng.lng.toFixed(6);
  L.popup().setLatLng(latlng).setContent(
    `<b>${q}</b>` +
    `<a class="gl" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${q}">Open in Google Maps (places, reviews)</a>` +
    `<a class="gl" target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${q}">Street View here</a>` +
    `<a class="gl" target="_blank" rel="noopener" href="https://www.google.com/maps/search/restaurants/@${q},18z">Places nearby</a>`).openOn(map);
}
map.on('click', e => gmPopup(e.latlng));

// --- place search (Nominatim) ---
$('search').onsubmit = async e => {
  e.preventDefault();
  const q = $('q').value.trim(), ul = $('results'); if (!q) return;
  ul.innerHTML = '<li>Searching…</li>';
  try {
    const r = await (await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=eg&viewbox=31.40,30.66,31.60,30.52&q=' + encodeURIComponent(q))).json();
    ul.innerHTML = r.length ? '' : '<li>No results</li>';
    r.forEach(p => {
      const li = document.createElement('li'); li.tabIndex = 0; li.textContent = p.display_name;
      li.onclick = li.onkeydown = ev => { if (ev.type === 'keydown' && ev.key !== 'Enter') return;
        ul.innerHTML = ''; map.setView([p.lat, p.lon], 18); gmPopup(L.latLng(p.lat, p.lon)); };
      ul.appendChild(li);
    });
  } catch { ul.innerHTML = '<li>Search failed, try again</li>'; }
};
$('q').oninput = () => { if (!$('q').value) $('results').innerHTML = ''; };

// --- shareable view in URL hash ---
map.on('moveend', () => { const c = map.getCenter(); history.replaceState(null, '', `#${map.getZoom()}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}`); });

$('infoBtn').onclick = () => $('about').showModal();
try { if (!localStorage.zgSeen) { localStorage.zgSeen = 1; $("about").showModal(); } } catch {}
show();
