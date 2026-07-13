// Content scripts run in an "isolated world" — they can't set variables directly on
// the page's own JavaScript. window.postMessage is the standard bridge: this script
// relays chrome.idle state from the extension's background worker into the page,
// where index.html listens for it.

window.postMessage({ source: 'attention-extension', type: 'ready' }, '*');

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'idleState') {
    window.postMessage({ source: 'attention-extension', type: 'idleState', state: msg.state, timestamp: msg.timestamp }, '*');
  }
});

// Get current state immediately on load rather than waiting for the next change.
chrome.runtime.sendMessage({ type: 'getIdleState' }, (res) => {
  if (res && res.state) {
    window.postMessage({ source: 'attention-extension', type: 'idleState', state: res.state, timestamp: Date.now() }, '*');
  }
});
