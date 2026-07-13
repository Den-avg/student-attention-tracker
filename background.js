// chrome.idle reports "active" / "idle" / "locked" based on real OS-level mouse and
// keyboard activity across the ENTIRE system — not just this browser, not just one
// tab. This is the only way (short of a native OS-level agent) to get a genuine
// system-wide signal from a browser extension. 15 seconds is the minimum detection
// interval Chrome allows, so state changes are reported at ~15s granularity.
const DETECTION_INTERVAL_SECONDS = 15;
chrome.idle.setDetectionInterval(DETECTION_INTERVAL_SECONDS);

function broadcastState(state) {
  chrome.tabs.query({ url: 'https://den-avg.github.io/student-attention-tracker/*' }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { type: 'idleState', state, timestamp: Date.now() }).catch(() => {});
    }
  });
}

chrome.idle.onStateChanged.addListener((state) => {
  broadcastState(state);
});

// Content script asks for the current state on page load, since onStateChanged only
// fires on a *change* and the page may load mid-state.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getIdleState') {
    chrome.idle.queryState(DETECTION_INTERVAL_SECONDS, (state) => sendResponse({ state }));
    return true; // keep the message channel open for the async response
  }
});
