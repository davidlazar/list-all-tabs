var totalTabs = 0;

function updateTotalTabCount() {
  browser.tabs.query({}).then((tabs) => {
    totalTabs = tabs.length;
  });
}
updateTotalTabCount();

function updateBadge() {
  browser.browserAction.setBadgeText({ text: totalTabs.toString() });
}
browser.browserAction.setBadgeBackgroundColor({ 'color': 'green' });

browser.tabs.onRemoved.addListener((tabId) => {
  totalTabs--;
  updateBadge();
});
browser.tabs.onCreated.addListener((tabId) => {
  totalTabs++;
  updateBadge();
});

function handleClick() {
  let url = browser.extension.getURL("tabs.html");
  browser.tabs.query({ url: url, currentWindow: true }).then((tabs) => {
    if (tabs.length > 0) {
      let tabId = tabs[0].id;
      browser.tabs.move(tabId, { index: -1 });
      browser.tabs.update(tabId, { active: true });
    } else {
      let createData = {
        url: "tabs.html"
      };
      browser.tabs.create(createData);
    }
  })
}

browser.browserAction.onClicked.addListener(handleClick);
