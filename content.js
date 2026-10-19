(() => {
  if (window.__scrapbookNotesLoaded) return;
  window.__scrapbookNotesLoaded = true;
  const stale = document.getElementById("scrapbook-notes-host");
  if (stale) stale.remove();

  const KEY = "stickyNotes";
  const els = new Map();
  let notes = [];
  let zTop = 1;
  let busy = false;
  let saveTimer = null;

  // ---------- Shadow DOM host ----------
  const host = document.createElement("div");
  host.id = "scrapbook-notes-host";
  host.style.cssText =
    "all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>
    .note{position:fixed;touch-action:none;user-select:none;
      filter:drop-shadow(0 8px 10px rgba(0,0,0,.28));}
    .skin{display:block;width:100%;height:auto;cursor:grab;-webkit-user-drag:none;}
    .note:active .skin{cursor:grabbing;}
    .text{position:absolute;outline:none;overflow-y:auto;scrollbar-width:none;
      white-space:pre-wrap;word-break:break-word;cursor:text;user-select:text;
      background:transparent;color:var(--ink);
      font-family:'ScrapHand','Caveat','Segoe Print','Comic Sans MS',cursive;
      text-shadow:0 0 .6px currentColor;}
    .text::-webkit-scrollbar{display:none;}
    .text:empty::before{content:'write something…';opacity:.35;}
    .note[data-missing] .text:empty::before{content:'⚠ image not found (put image.png in images folder)';color:#b00;opacity:.85;font-size:.65em;}
    .del{position:absolute;top:1.5%;right:1.5%;width:22px;height:22px;border:0;
      border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font:16px/22px sans-serif;
      cursor:pointer;opacity:0;transition:opacity .15s;padding:0;}
    .note:hover .del{opacity:1;}
    .resize{position:absolute;right:0;bottom:0;width:20px;height:20px;cursor:nwse-resize;
      opacity:0;transition:opacity .15s;
      background:linear-gradient(135deg,transparent 50%,rgba(0,0,0,.45) 50%);}
    .note:hover .resize{opacity:1;}
  </style><div class="layer"></div>`;
  const layer = shadow.querySelector(".layer");
  document.documentElement.appendChild(host);

  // ---------- Handwriting font ----------
  (async () => {
    try {
      const buf = await (await fetch(chrome.runtime.getURL("fonts/Caveat.ttf"))).arrayBuffer();
      const face = new FontFace("ScrapHand", buf);
      await face.load();
      document.fonts.add(face);
    } catch (e) { /* fallback */ }
  })();

  // ---------- Artwork Loader ----------
  const srcCache = {};
  const FALLBACK_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 720">' +
    '<rect x="10" y="40" width="620" height="670" rx="18" fill="#fdf6e3" stroke="#d6c4a0" stroke-width="4"/>' +
    '<rect x="270" y="0" width="100" height="80" rx="14" fill="#3c3c46"/>' +
    [1,2,3,4,5,6,7].map((k) => '<line x1="50" x2="590" y1="' + (158 + 68 * k - 14) +
      '" y2="' + (158 + 68 * k - 14) + '" stroke="#a0aac8" stroke-width="2"/>').join("") +
    "</svg>";
  const FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(FALLBACK_SVG);

  async function skinSrc(skin) {
    if (srcCache[skin.id]) return srcCache[skin.id];
    const names = [skin.file, skin.file.replace(/^.*\//, "")];
    for (const name of names) {
      try {
        const res = await fetch(chrome.runtime.getURL(name));
        if (!res.ok) continue;
        const blob = await res.blob();
        return (srcCache[skin.id] = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result);
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        }));
      } catch (e) { /* try next */ }
    }
    return null;
  }

  const getSkin = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- Storage ----------
  function save() {
    clearTimeout(saveTimer); saveTimer = null;
    chrome.storage.local.set({ [KEY]: notes });
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); }

  // ---------- Build / update one note ----------
  function build(n) {
    const id = n.id;
    const el = document.createElement("div");
    el.className = "note";
    el.innerHTML =
      '<img class="skin" draggable="false" alt="">' +
      '<div class="text" contenteditable="plaintext-only" spellcheck="false"></div>' +
      '<button class="del" title="Delete note">×</button><div class="resize"></div>';
    const text = el.querySelector(".text");
    const get = () => notes.find((x) => x.id === id);

    const img = el.querySelector(".skin");
    const useFallback = () => { el.dataset.missing = "1"; img.onerror = null; img.src = FALLBACK; };
    img.onerror = useFallback;
    skinSrc(getSkin(n.skin)).then((src) => { if (src) img.src = src; else useFallback(); });

    text.addEventListener("input", () => {
      const m = get();
      if (m) { m.text = text.innerText.replace(/\n$/, ""); saveSoon(); }
    });
    ["keydown", "keyup", "keypress"].forEach((ev) =>
      text.addEventListener(ev, (e) => e.stopPropagation()));

    el.querySelector(".del").addEventListener("click", () => {
      const m = get();
      if (m && m.text && !confirm("Delete this note?")) return;
      notes = notes.filter((x) => x.id !== id);
      save(); render();
    });

    el.addEventListener("pointerdown", (e) => {
      const m = get(); if (!m) return;
      m.z = ++zTop; el.style.zIndex = m.z;
      if (e.target.closest(".text,.del")) return;
      if (e.target.closest(".resize")) startResize(e, el, m);
      else startDrag(e, el, m);
    });
    return el;
  }

  function apply(el, n) {
    const skin = getSkin(n.skin);
    const s = n.w / skin.baseWidth;
    el.style.left = n.x + "px";
    el.style.top = n.y + "px";
    el.style.width = n.w + "px";
    el.style.zIndex = n.z || 1;
    const t = el.querySelector(".text");
    t.style.top = skin.box.top + "%";
    t.style.left = skin.box.left + "%";
    t.style.right = skin.box.right + "%";
    t.style.bottom = skin.box.bottom + "%";
    t.style.fontSize = skin.fontSize * s + "px";
    t.style.lineHeight = skin.lineHeight * s + "px";
    t.style.transform = `rotate(${skin.tilt || 0}deg)`;
    t.style.transformOrigin = "top left";
    el.style.setProperty("--ink", skin.ink);
    if (shadow.activeElement !== t && t.innerText.replace(/\n$/, "") !== (n.text || ""))
      t.innerText = n.text || "";
  }

  function render() {
    for (const [id, el] of els) {
      const n = notes.find((x) => x.id === id);
      if (!n || n.visible === false) { el.remove(); els.delete(id); }
    }
    for (const n of notes) {
      if (n.visible === false) continue; // Skip rendering if unchecked in checklist
      let el = els.get(n.id);
      if (!el) { el = build(n); els.set(n.id, el); layer.appendChild(el); }
      apply(el, n);
    }
  }

  // ---------- Drag & resize ----------
  function startDrag(e, el, m) {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    busy = true;
    const sx = e.clientX, sy = e.clientY, ox = m.x, oy = m.y;
    const move = (ev) => {
      m.x = clamp(ox + ev.clientX - sx, -m.w + 50, innerWidth - 50);
      m.y = clamp(oy + ev.clientY - sy, 0, innerHeight - 50);
      el.style.left = m.x + "px"; el.style.top = m.y + "px";
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      busy = false; save();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  }

  function startResize(e, el, m) {
    e.preventDefault(); e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    busy = true;
    const sx = e.clientX, ow = m.w;
    const move = (ev) => { m.w = clamp(ow + ev.clientX - sx, 170, 800); apply(el, m); };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      busy = false; save();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  }

  // ---------- Init + storage sync ----------
  chrome.storage.local.get([KEY]).then((r) => {
    notes = r[KEY] || [];
    zTop = Math.max(1, ...notes.map((n) => n.z || 1));
    render();
  });

  chrome.runtime.onMessage.addListener((msg, _sender, send) => {
    if (msg && msg.type === "ping")
      send({ ok: true, count: notes.filter(n => n.visible !== false).length });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[KEY] && !busy) {
      notes = changes[KEY].newValue || [];
      zTop = Math.max(zTop, ...notes.map((n) => n.z || 1));
      render();
    }
  });
})();