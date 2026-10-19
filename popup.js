const KEY = "stickyNotes";
const $ = (id) => document.getElementById(id);

SKINS.forEach((s) => $("skin").add(new Option(s.name, s.id)));

async function load() {
  return (await chrome.storage.local.get(KEY))[KEY] || [];
}

async function refreshUI() {
  const notes = await load();
  const listContainer = $("notesList");
  listContainer.innerHTML = "";
  
  $("count").textContent = notes.length + (notes.length === 1 ? " note saved" : " notes saved");

  if (notes.length === 0) {
    listContainer.innerHTML = '<div style="font-size:11px;text-align:center;opacity:0.6;padding:8px;">No notes yet.</div>';
    return;
  }

  notes.forEach((n, idx) => {
    const item = document.createElement("div");
    item.className = "note-item";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = n.visible !== false; // defaults to true
    chk.onchange = async () => {
      n.visible = chk.checked;
      await chrome.storage.local.set({ [KEY]: notes });
    };

    const snippet = document.createElement("span");
    snippet.className = "note-snippet";
    snippet.textContent = n.text.trim() ? n.text.split("\n")[0] : `(Note #${idx + 1} - Empty)`;

    item.appendChild(chk);
    item.appendChild(snippet);
    listContainer.appendChild(item);
  });
}

async function ensureInjected() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const st = $("status");
  if (!tab || !/^https?:/.test(tab.url || "")) {
    st.textContent = "⚠ Can't run on this page (chrome:// blocked).";
    return false;
  }
  try {
    const r = await chrome.tabs.sendMessage(tab.id, { type: "ping" });
    if (r && r.ok) { st.textContent = "✓ Active on this page"; return true; }
  } catch (e) { /* not injected yet */ }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["skins.js", "content.js"] });
    await new Promise((r) => setTimeout(r, 200));
    st.textContent = "✓ Active on this page";
    return true;
  } catch (e) {
    st.textContent = "⚠ Blocked on this page.";
    return false;
  }
}

$("add").onclick = async () => {
  await ensureInjected();
  const notes = await load();
  const skin = SKINS.find((s) => s.id === $("skin").value) || SKINS[0];
  const k = notes.length % 8;
  notes.push({
    id: crypto.randomUUID(),
    skin: skin.id,
    x: 80 + k * 32, y: 80 + k * 32,
    w: skin.baseWidth,
    z: Math.max(1, ...notes.map((n) => n.z || 1)) + 1,
    text: "",
    visible: true
  });
  await chrome.storage.local.set({ [KEY]: notes });
  refreshUI();
};

$("export").onclick = async () => {
  const data = { app: "scrapbook-sticky-notes", version: 1, exportedAt: new Date().toISOString(), notes: await load() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "sticky-notes-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

$("import").onclick = () => $("file").click();
$("file").onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const parsed = JSON.parse(await f.text());
    const incoming = Array.isArray(parsed) ? parsed : parsed.notes;
    if (!Array.isArray(incoming)) throw new Error("bad file");
    const existing = await load();
    const ids = new Set(existing.map((n) => n.id));
    incoming.forEach((n) => { if (!ids.has(n.id)) existing.push(n); });
    await chrome.storage.local.set({ [KEY]: existing });
    refreshUI();
  } catch (err) { alert("Couldn't read that file."); }
  e.target.value = "";
};

// Initial Setup
refreshUI();
chrome.storage.onChanged.addListener(refreshUI);
ensureInjected();