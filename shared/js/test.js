const fs = require('fs')
const request = require('request');

var fakeRequest = {type: 'script'};
let fakeTab = {
    tabId: 0,
    url: 'http://test.com',
    site: {domain: 'test.com'}
}

var noopFunc = function () {}

global.chrome = {
    runtime : {
        onMessage : {
            addListener: noopFunc
        },
        getManifest : () => { return {version: 0}  }
    },
    alarms : {
        create : noopFunc,
        onAlarm : {
            addListener: noopFunc
        }
    },
    storage : {
        local : {
            get : noopFunc
        }
    },
}
const perf = require('execution-time')();
const settings = require('./settings.js')
const constants = require('./../data/constants.js')
const load = require('./load.js')
const {isTracker} = require('./trackers.js')
global.trackerLists = require('./trackerLists').getLists()
global.abp = require('abp-filter-parser')
global.abpLists = require('./abp-preprocessed.es6')

async function waitForSettings() {
    await settings.ready().then()
}

function loadLists () {
    fs.readFile('../' + constants.entityMap, {encoding: 'utf-8'}, (err,data) => {
        if (!err) {
            global.entityMap = JSON.parse(data)
        } else {
            console.log(err);
        }
    })

    request({method: 'GET', uri: constants.entityList, gzip: true}, (err, res, data) => {
        if (!err) {
            global.entityList = JSON.parse(data)
            setTimeout(runtests, 10000)
        } else {
            console.log(err)
        }
    })

}

waitForSettings()
loadLists()

function runtests () {
    perf.start()
    let tracker = isTracker('https://gdoubleclicksss.net/pead/id', fakeTab, fakeRequest) || {block: false}
    let time = perf.stop()
    tracker.time = time
    console.log(tracker)
}

