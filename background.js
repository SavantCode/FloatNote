// Chrome does not inject content scripts into tabs that were already open
// when the extension was installed/reloaded. Do it ourselves.
const FILES = ["skins.js", "content.js"];

async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const t of tabs) {
    try { await chrome.scripting.executeScript({ target: { tabId: t.id }, files: FILES }); }
    catch (e) { /* page not allowed (e.g. Web Store) */ }
  }
}
chrome.runtime.onInstalled.addListener(injectIntoOpenTabs);
chrome.runtime.onStartup.addListener(injectIntoOpenTabs);
