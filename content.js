// Content scripts run in an "isolated world" — they can't set variables directly on
// the page's own JavaScript. window.postMessage is the standard bridge: this script
// relays chrome.idle state from the extension's background worker into the page,
// where index.html listens for it.

window.postMessage({ source: 'attention-extension', type: 'ready' }, '*');

function requestAndRelayState() {
  chrome.runtime.sendMessage({ type: 'getIdleState' }, (res) => {
    if (res && res.state) {
      window.postMessage({ source: 'attention-extension', type: 'idleState', state: res.state, timestamp: Date.now() }, '*');
    }
  });
}

// onStateChanged only fires on a *transition* (idle->active or active->idle), not
// continuously while a state persists. Relying on that alone means the page's "last
// active" timestamp goes stale and never updates while someone stays continuously
// active in another tab/app — making genuine activity look like idle time. Polling
// the current state every 10s (independent of transitions) fixes that.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'idleState') {
    window.postMessage({ source: 'attention-extension', type: 'idleState', state: msg.state, timestamp: msg.timestamp }, '*');
  }
});

requestAndRelayState(); // immediately on load
setInterval(requestAndRelayState, 10000); // then every 10s regardless of transitions
