var mode = "goto";

function gotoMode() {
  document.body.className = "goto-mode";
  mode = "goto";
  setFooter("#g-mode");
}

function killMode() {
  document.body.className = "kill-mode";
  mode = "kill";
  setFooter("#k-mode");
}

function promoteMode() {
  document.body.className = "promote-mode";
  mode = "promote";
  setFooter("#p-mode");
}

function setFooter(modeId) {
  let ps = document.querySelectorAll("#mode-footer p");
  for (let p of ps) {
    p.className = "";
  }
  document.querySelector(modeId).className = "footer-selected";
}

// Start off in goto mode.
gotoMode();

window.addEventListener("keypress", (e) => {
  if (e.key == "k") {
    killMode();
  } else if (e.key == "p") {
    promoteMode();
  } else if (e.key == "g" || e.key == "Escape") {
    gotoMode();
  }
});

function updateTabsLists() {
  browser.tabs.query({}).then((tabs) => {
    var dupes = {};
    var hosts = {};

    tabs.reverse();

    let allTabsList = document.createElement('ul');

    for (let tab of tabs) {
      if (tab.url in dupes) {
        dupes[tab.url].push(tab)
      } else {
        dupes[tab.url] = [tab]
      }

      let url = new URL(tab.url);
      if (url.host in hosts) {
        hosts[url.host].push(tab)
      } else {
        hosts[url.host] = [tab]
      }

      allTabsList.appendChild(renderTabItem(tab));
    }

    document.getElementById("all-tabs-list").innerHTML = "";
    document.getElementById("all-tabs-list").appendChild(allTabsList);

    let topHosts = Object.keys(hosts).sort(function (a, b) { return hosts[b].length - hosts[a].length });
    let topDupes = Object.keys(dupes).sort(function (a, b) { return dupes[b].length - dupes[a].length });

    let dupesList = document.createElement("ul");
    for (let url of topDupes) {
      let tabs = dupes[url];
      if (tabs.length < 2) {
        break;
      }
      for (let tab of tabs) {
        dupesList.appendChild(renderTabItem(tab));
      }
    }
    document.getElementById("dupes-tabs-list").innerHTML = "";
    document.getElementById("dupes-tabs-list").appendChild(dupesList);

    let topHostsList = document.getElementById("top-hosts-list");
    topHostsList.innerHTML = "";
    for (let host of topHosts) {
      let tabs = hosts[host];
      if (tabs.length < 2) {
        break;
      }

      let tabList = document.createElement("ul");
      tabList.className = "tabs-list";
      for (let tab of tabs) {
        tabList.appendChild(renderTabItem(tab));
      }

      let h3 = document.createElement("h3");
      h3.textContent = host;

      topHostsList.appendChild(h3);
      topHostsList.appendChild(tabList);
    }

    document.querySelectorAll(".tabs-list").forEach((e) => addClickListener(e));
  })
}

function addClickListener(listElement) {
  listElement.addEventListener("click", (e) => {
    var elt = e.target.closest("li");
    if (elt != null) {
      var tabId = +elt.getAttribute("data-tabid");
      if (mode == "kill") {
        let removing = browser.tabs.remove(tabId);
        removing.then(() => {
          // See the onRemoved handler also.
          console.log("removed tab: ", tabId);
          elt.classList.add("deleted-tab");
        })
      } else if (mode == "promote") {
        let moving = browser.tabs.move(tabId, { index: -1 });
        moving.then(() => {
          elt.remove();
          listElement.prepend(elt);
        })
      } else if (mode == "goto") {
        browser.tabs.update(tabId, { active: true });
      }
    }
  })
}

function renderTabItem(tab) {
  var li = document.createElement("li");
  li.setAttribute("data-tabid", tab.id);
  var pTitle = document.createElement("p");
  pTitle.classList.add("tab-title");
  pTitle.textContent = tab.title;
  var pURL = document.createElement("p");
  pURL.classList.add("tab-url");
  pURL.textContent = tab.url;
  li.appendChild(pTitle);
  li.appendChild(pURL);
  return li;
}

document.addEventListener("DOMContentLoaded", updateTabsLists);

//onRemoved listener. fired when tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  var elts = document.querySelectorAll(`li[data-tabid="${tabId}"]`)
  for (var elt of elts) {
    elt.classList.add("deleted-tab");
  }
});

browser.tabs.onCreated.addListener((tab) => {
  let li = renderTabItem(tab);
  document.getElementById("all-tabs-list").prepend(li);
  // TODO get the position right; update hosts / dupes lists.
});
