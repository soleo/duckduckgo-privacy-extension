/*
 * Copyright (C) 2012, 2016 DuckDuckGo, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var debugRequest = false;
var trackers = require('trackers');
var utils = require('utils');
var settings = require('settings');
var stats = require('stats');
var db = require('db')
var https = require('https')


/*
 * experimental code substitution setup to validate this technique
 * see onBeforeRequest handler below.
 *
 * The base64 encoded text below was produced for this experiment
 * by slightly modifying code from
 *
 * https://github.com/uBlockOrigin/uAssets/blob/master/filters/resources.txt
 *
 * and turning them into base64 manually for purposes of direct validation
 * ie:
 *
 * - save a portion of code as a file
 * - transform with `base64` on the command line 
 * - :r into this code
 *
 */

var b64dataheader = "data:application/javascript;base64,";

// ga.js replacement
// based off https://github.com/uBlockOrigin/uAssets/blob/master/filters/resources.txt#L186
var ga_js_txt =
  "Y29uc29sZS5sb2coInJ1c3NlbGwtZ2EuanMgcm9vdCIpOwooZnVuY3Rpb24oKSB7CgogICAgY29uc29sZS5sb2coInJ1c3NlbGwtZ2EuanMgYm9keSIpOwoKCXZhciBub29wZm4gPSBmdW5jdGlvbigpIHsKICAgICAgICBjb25zb2xlLmxvZygicnVzc2VsbCBnYSBub29wIik7CgkJOwoJfTsKCS8vCgl2YXIgR2FxID0gZnVuY3Rpb24oKSB7CgkJOwoJfTsKCUdhcS5wcm90b3R5cGUuTmEgPSBub29wZm47CglHYXEucHJvdG90eXBlLk8gPSBub29wZm47CglHYXEucHJvdG90eXBlLlNhID0gbm9vcGZuOwoJR2FxLnByb3RvdHlwZS5UYSA9IG5vb3BmbjsKCUdhcS5wcm90b3R5cGUuVmEgPSBub29wZm47CglHYXEucHJvdG90eXBlLl9jcmVhdGVBc3luY1RyYWNrZXIgPSBub29wZm47CglHYXEucHJvdG90eXBlLl9nZXRBc3luY1RyYWNrZXIgPSBub29wZm47CglHYXEucHJvdG90eXBlLl9nZXRQbHVnaW4gPSBub29wZm47CglHYXEucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbihhKSB7CgkJaWYgKCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyApIHsKCQkJYSgpOyByZXR1cm47CgkJfQoJCWlmICggQXJyYXkuaXNBcnJheShhKSA9PT0gZmFsc2UgKSB7CgkJCXJldHVybjsKCQl9CgkJLy8gaHR0cHM6Ly90d2l0dGVyLmNvbS9jYXRvdml0Y2gvc3RhdHVzLzc3NjQ0MjkzMDM0NTIxODA0OAoJCS8vIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9nYWpzL21ldGhvZHMvZ2FKU0FwaURvbWFpbkRpcmVjdG9yeSNfZ2F0LkdBX1RyYWNrZXJfLl9saW5rCgkJaWYgKCBhWzBdID09PSAnX2xpbmsnICYmIHR5cGVvZiBhWzFdID09PSAnc3RyaW5nJyApIHsKCQkJd2luZG93LmxvY2F0aW9uLmFzc2lnbihhWzFdKTsKCQl9CgkJLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvdUJsb2NrL2lzc3Vlcy8yMTYyCgkJaWYgKCBhWzBdID09PSAnX3NldCcgJiYgYVsxXSA9PT0gJ2hpdENhbGxiYWNrJyAmJiB0eXBlb2YgYVsyXSA9PT0gJ2Z1bmN0aW9uJyApIHsKCQkJYVsyXSgpOwoJCX0KCX07CgkvLwoJdmFyIHRyYWNrZXIgPSAoZnVuY3Rpb24oKSB7CgkJdmFyIG91dCA9IHt9OwoJCXZhciBhcGkgPSBbCgkJCSdfYWRkSWdub3JlZE9yZ2FuaWMgX2FkZElnbm9yZWRSZWYgX2FkZEl0ZW0gX2FkZE9yZ2FuaWMnLAoJCQknX2FkZFRyYW5zIF9jbGVhcklnbm9yZWRPcmdhbmljIF9jbGVhcklnbm9yZWRSZWYgX2NsZWFyT3JnYW5pYycsCgkJCSdfY29va2llUGF0aENvcHkgX2RlbGV0ZUN1c3RvbVZhciBfZ2V0TmFtZSBfc2V0QWNjb3VudCcsCgkJCSdfZ2V0QWNjb3VudCBfZ2V0Q2xpZW50SW5mbyBfZ2V0RGV0ZWN0Rmxhc2ggX2dldERldGVjdFRpdGxlJywKCQkJJ19nZXRMaW5rZXJVcmwgX2dldExvY2FsR2lmUGF0aCBfZ2V0U2VydmljZU1vZGUgX2dldFZlcnNpb24nLAoJCQknX2dldFZpc2l0b3JDdXN0b21WYXIgX2luaXREYXRhIF9saW5rIF9saW5rQnlQb3N0JywKCQkJJ19zZXRBbGxvd0FuY2hvciBfc2V0QWxsb3dIYXNoIF9zZXRBbGxvd0xpbmtlciBfc2V0Q2FtcENvbnRlbnRLZXknLAoJCQknX3NldENhbXBNZWRpdW1LZXkgX3NldENhbXBOYW1lS2V5IF9zZXRDYW1wTk9LZXkgX3NldENhbXBTb3VyY2VLZXknLAoJCQknX3NldENhbXBUZXJtS2V5IF9zZXRDYW1wYWlnbkNvb2tpZVRpbWVvdXQgX3NldENhbXBhaWduVHJhY2sgX3NldENsaWVudEluZm8nLAoJCQknX3NldENvb2tpZVBhdGggX3NldENvb2tpZVBlcnNpc3RlbmNlIF9zZXRDb29raWVUaW1lb3V0IF9zZXRDdXN0b21WYXInLAoJCQknX3NldERldGVjdEZsYXNoIF9zZXREZXRlY3RUaXRsZSBfc2V0RG9tYWluTmFtZSBfc2V0TG9jYWxHaWZQYXRoJywKCQkJJ19zZXRMb2NhbFJlbW90ZVNlcnZlck1vZGUgX3NldExvY2FsU2VydmVyTW9kZSBfc2V0UmVmZXJyZXJPdmVycmlkZSBfc2V0UmVtb3RlU2VydmVyTW9kZScsCgkJCSdfc2V0U2FtcGxlUmF0ZSBfc2V0U2Vzc2lvblRpbWVvdXQgX3NldFNpdGVTcGVlZFNhbXBsZVJhdGUgX3NldFNlc3Npb25Db29raWVUaW1lb3V0JywKCQkJJ19zZXRWYXIgX3NldFZpc2l0b3JDb29raWVUaW1lb3V0IF90cmFja0V2ZW50IF90cmFja1BhZ2VMb2FkVGltZScsCgkJCSdfdHJhY2tQYWdldmlldyBfdHJhY2tTb2NpYWwgX3RyYWNrVGltaW5nIF90cmFja1RyYW5zJywKCQkJJ192aXNpdENvZGUnCgkJXS5qb2luKCcgJykuc3BsaXQoL1xzKy8pOwoJCXZhciBpID0gYXBpLmxlbmd0aDsKCQl3aGlsZSAoIGktLSApIHsKCQkJb3V0W2FwaVtpXV0gPSBub29wZm47CgkJfQoJCW91dC5fZ2V0TGlua2VyVXJsID0gZnVuY3Rpb24oYSkgewoJCQlyZXR1cm4gYTsKCQl9OwoJCXJldHVybiBvdXQ7Cgl9KSgpOwoJLy8KCXZhciBHYXQgPSBmdW5jdGlvbigpIHsKCQk7Cgl9OwoJR2F0LnByb3RvdHlwZS5fYW5vbnltaXplSVAgPSBub29wZm47CglHYXQucHJvdG90eXBlLl9jcmVhdGVUcmFja2VyID0gbm9vcGZuOwoJR2F0LnByb3RvdHlwZS5fZm9yY2VTU0wgPSBub29wZm47CglHYXQucHJvdG90eXBlLl9nZXRQbHVnaW4gPSBub29wZm47CglHYXQucHJvdG90eXBlLl9nZXRUcmFja2VyID0gZnVuY3Rpb24oKSB7CgkJcmV0dXJuIHRyYWNrZXI7Cgl9OwoJR2F0LnByb3RvdHlwZS5fZ2V0VHJhY2tlckJ5TmFtZSA9IGZ1bmN0aW9uKCkgewoJCXJldHVybiB0cmFja2VyOwoJfTsKCUdhdC5wcm90b3R5cGUuX2dldFRyYWNrZXJzID0gbm9vcGZuOwoJR2F0LnByb3RvdHlwZS5hYSA9IG5vb3BmbjsKCUdhdC5wcm90b3R5cGUuYWIgPSBub29wZm47CglHYXQucHJvdG90eXBlLmhiID0gbm9vcGZuOwoJR2F0LnByb3RvdHlwZS5sYSA9IG5vb3BmbjsKCUdhdC5wcm90b3R5cGUub2EgPSBub29wZm47CglHYXQucHJvdG90eXBlLnBhID0gbm9vcGZuOwoJR2F0LnByb3RvdHlwZS51ID0gbm9vcGZuOwoJdmFyIGdhdCA9IG5ldyBHYXQoKTsKCXdpbmRvdy5fZ2F0ID0gZ2F0OwoJLy8KCXZhciBnYXEgPSBuZXcgR2FxKCk7CgkoZnVuY3Rpb24oKSB7CgkJdmFyIGFhID0gd2luZG93Ll9nYXEgfHwgW107CgkJaWYgKCBBcnJheS5pc0FycmF5KGFhKSApIHsKCQkJd2hpbGUgKCBhYVswXSApIHsKCQkJCWdhcS5wdXNoKGFhLnNoaWZ0KCkpOwoJCQl9CgkJfQoJfSkoKTsKCXdpbmRvdy5fZ2FxID0gZ2FxLnFmID0gZ2FxOwp9KSgpOwo=";

// analytics.js replacement
// based off https://github.com/uBlockOrigin/uAssets/blob/master/filters/resources.txt#L286
var ga_analytics_js_txt = 
    "KGZ1bmN0aW9uKCkgewogICAgY29uc29sZS5sb2coInJ1c3NlbGwgdGVzdCBnb29nbGUtYW5hbHl0aWNzLmNvbS9hbmFseXRpY3MuanMiKTsKCS8vIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy8KCXZhciBub29wZm4gPSBmdW5jdGlvbigpIHsKCQk7Cgl9OwoJdmFyIG5vb3BudWxsZm4gPSBmdW5jdGlvbigpIHsKCQlyZXR1cm4gbnVsbDsKCX07CgkvLwoJdmFyIFRyYWNrZXIgPSBmdW5jdGlvbigpIHsKCQk7Cgl9OwoJdmFyIHAgPSBUcmFja2VyLnByb3RvdHlwZTsKCXAuZ2V0ID0gbm9vcGZuOwoJcC5zZXQgPSBub29wZm47CglwLnNlbmQgPSBub29wZm47CgkvLwoJdmFyIGdhTmFtZSA9IHdpbmRvdy5Hb29nbGVBbmFseXRpY3NPYmplY3QgfHwgJ2dhJzsKCXZhciBnYSA9IGZ1bmN0aW9uKCkgewoJCXZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOwoJCWlmICggbGVuID09PSAwICkgewoJCQlyZXR1cm47CgkJfQoJCXZhciBmID0gYXJndW1lbnRzW2xlbi0xXTsKCQlpZiAoIHR5cGVvZiBmICE9PSAnb2JqZWN0JyB8fCBmID09PSBudWxsIHx8IHR5cGVvZiBmLmhpdENhbGxiYWNrICE9PSAnZnVuY3Rpb24nICkgewoJCQlyZXR1cm47CgkJfQoJCXRyeSB7CgkJCWYuaGl0Q2FsbGJhY2soKTsKCQl9IGNhdGNoIChleCkgewoJCX0KCX07CglnYS5jcmVhdGUgPSBmdW5jdGlvbigpIHsKCQlyZXR1cm4gbmV3IFRyYWNrZXIoKTsKCX07CglnYS5nZXRCeU5hbWUgPSBub29wbnVsbGZuOwoJZ2EuZ2V0QWxsID0gZnVuY3Rpb24oKSB7CgkJcmV0dXJuIFtdOwoJfTsKCWdhLnJlbW92ZSA9IG5vb3BmbjsKCXdpbmRvd1tnYU5hbWVdID0gZ2E7Cn0pKCk7Cg==";

/*****/



// Set browser for popup asset paths
// chrome doesn't have getBrowserInfo so we'll default to chrome
// and try to detect if this is firefox
var browser = "chrome";
try {
    chrome.runtime.getBrowserInfo((info) => {
        if (info.name === "Firefox") browser = "moz";
    });
} catch (e) {};

// popup will ask for the browser type then it is created
chrome.runtime.onMessage.addListener((req, sender, res) => {
    if (req.getBrowser) {
        res(browser);
    }
    return true;
});

function Background() {
  $this = this;

  // clearing last search on browser startup
  settings.updateSetting('last_search', '')

  var os = "o";
  if (window.navigator.userAgent.indexOf("Windows") != -1) os = "w";
  if (window.navigator.userAgent.indexOf("Mac") != -1) os = "m";
  if (window.navigator.userAgent.indexOf("Linux") != -1) os = "l";

  localStorage['os'] = os;

  chrome.tabs.query({currentWindow: true, status: 'complete'}, function(savedTabs){
      for(var i = 0; i < savedTabs.length; i++){
          var tab = savedTabs[i];

          if(tab.url){
              let newTab = tabManager.create(tab);
              // check https status of saved tabs so we have the correct site score
              if (newTab.url.match(/^https:\/\//)) {
                  newTab.site.score.update({hasHTTPS: true})
              }
          }
      }
  });

  chrome.runtime.onInstalled.addListener(function(details) {
    // only run the following section on install
    if (details.reason.match(/install|update/)) {
        ATB.onInstalled();
    }
  });
}

var background
settings.ready().then(() => new Background())

chrome.omnibox.onInputEntered.addListener(function(text) {
  chrome.tabs.query({
    'currentWindow': true,
    'active': true
  }, function(tabs) {
    chrome.tabs.update(tabs[0].id, {
      url: "https://duckduckgo.com/?q=" + encodeURIComponent(text) + "&bext=" + localStorage['os'] + "cl"
    });
  });
});

// This adds Context Menu when user select some text.
// Create context menu:
chrome.contextMenus.create({
  title: 'Search DuckDuckGo for "%s"',
  contexts: ["selection"],
  onclick: function(info) {
    var queryText = info.selectionText;
    chrome.tabs.create({
      url: "https://duckduckgo.com/?q=" + queryText + "&bext=" + localStorage['os'] + "cr"
    });
  }
});

/**
 * Before each request:
 * - Add ATB param
 * - Block tracker requests
 * - Upgrade http -> https per HTTPS Everywhere rules
 */
chrome.webRequest.onBeforeRequest.addListener(
    function (requestData) {

        let tabId = requestData.tabId;

        // Skip requests to background tabs
        if (tabId === -1) { return }

        let thisTab = tabManager.get(requestData);

        // For main_frame requests: create a new tab instance whenever we either
        // don't have a tab instance for this tabId or this is a new requestId.
        if (requestData.type === "main_frame") {
            if (!thisTab || (thisTab.requestId !== requestData.requestId)) {
                thisTab = tabManager.create(requestData);
            }

            // add atb params only to main_frame
            let ddgAtbRewrite = ATB.redirectURL(requestData);
            if (ddgAtbRewrite) return ddgAtbRewrite;

        }
        else {


            /*
             * experimental code substitution
             * This demonstrates the technique of redirecting a URL with a
             * data URL for the purpose of substituting tracker code.
             *
             * NOTE: this is for experimental validation purposes only
             */

            if (/google-analytics.com\/ga\.js$/.test(requestData.url)) {
                console.log("redirecting google analytics/ga.js: " + requestData.url);
                return {redirectUrl: b64dataheader + ga_js_txt };
            }

            if (/google-analytics.com\/analytics\.js$/.test(requestData.url)) {
                console.log("redirecting google analytics/analytics.js: " + requestData.url);
                return {redirectUrl: b64dataheader + ga_analytics_js_txt };
            }



            /**
             * Check that we have a valid tab
             * there is a chance this tab was closed before
             * we got the webrequest event
             */
            if (!(thisTab && thisTab.url && thisTab.id)) return

            /**
             * skip any broken sites
             */
            if (thisTab.site.isBroken) {
                console.log('temporarily skip tracker blocking for site: '
                  + utils.extractHostFromURL(thisTab.url) + '\n'
                  + 'more info: https://github.com/duckduckgo/content-blocking-whitelist')
                return
            }

            /**
             * Tracker blocking
             * If request is a tracker, cancel the request
             */
            chrome.runtime.sendMessage({'updateTabData': true})

            var tracker = trackers.isTracker(requestData.url, thisTab, requestData);

            // count and block trackers. Skip things that matched in the trackersWhitelist
            if (tracker && !(tracker.type === 'trackersWhitelist')) {
                // only count trackers on pages with 200 response. Trackers on these sites are still
                // blocked below but not counted toward company stats
                if (thisTab.statusCode === 200) {
                    // record all tracker urls on a site even if we don't block them
                    thisTab.site.addTracker(tracker)

                    // record potential blocked trackers for this tab
                    thisTab.addToTrackers(tracker)
                }

                // Block the request if the site is not whitelisted
                if (!thisTab.site.whitelisted && tracker.block) {
                    thisTab.addOrUpdateTrackersBlocked(tracker);
                    chrome.runtime.sendMessage({'updateTabData': true})

                    // update badge icon for any requests that come in after
                    // the tab has finished loading
                    if (thisTab.status === "complete") thisTab.updateBadgeIcon()


                    if (tracker.parentCompany !== 'unknown' && thisTab.statusCode === 200){
                        Companies.add(tracker.parentCompany)
                    }

                    // for debugging specific requests. see test/tests/debugSite.js
                    if (debugRequest && debugRequest.length) {
                        if (debugRequest.includes(tracker.url)) {
                            console.log("UNBLOCKED: ", tracker.url)
                            return
                        }
                    }

                    console.info( "blocked " + utils.extractHostFromURL(thisTab.url)
                                 + " [" + tracker.parentCompany + "] " + requestData.url);

                    // tell Chrome to cancel this webrequest
                    return {cancel: true};
                }
            }
        }

        /**
         * HTTPS Everywhere rules
         * If an upgrade rule is found, request is upgraded from http to https
         */

         if (!thisTab.site) return

         /**
          * Skip https upgrade on broken sites
          */
        if (thisTab.site.isBroken) {
            console.log('temporarily skip https upgrades for site: '
                  + utils.extractHostFromURL(thisTab.url) + '\n'
                  + 'more info: https://github.com/duckduckgo/content-blocking-whitelist')
            return
        }

        // Avoid redirect loops
        if (thisTab.httpsRedirects[requestData.requestId] >= 7) {
            console.log('HTTPS: cancel https upgrade. redirect limit exceeded for url: \n' + requestData.url)
            return {redirectUrl: thisTab.downgradeHttpsUpgradeRequest(requestData)}
        }

        // Fetch upgrade rule from db
        return new Promise ((resolve) => {
            const isMainFrame = requestData.type === 'main_frame' ? true : false

            if (https.isReady) {
                https.pipeRequestUrl(requestData.url, thisTab, isMainFrame).then(
                    (url) => {
                        if (url.toLowerCase() !== requestData.url.toLowerCase()) {
                            console.log('HTTPS: upgrade request url to ' + url)
                            if (isMainFrame) thisTab.upgradedHttps = true
                            thisTab.addHttpsUpgradeRequest(url)
                            resolve({redirectUrl: url})
                        }
                        resolve()
                    }
                )
            } else {
              resolve()
            }
        })
    },
    {
        urls: [
            "<all_urls>",
        ],
        types: constants.requestListenerTypes
    },
    ["blocking"]
);

chrome.webRequest.onHeadersReceived.addListener(
        ATB.updateSetAtb,
    {
        urls: [
            "*://duckduckgo.com/?*",
            "*://*.duckduckgo.com/?*"
        ]
    }
);
