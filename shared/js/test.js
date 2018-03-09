const fs = require('fs')
const request = require('request');
const perf = require('execution-time')();
const stringify = require('csv-stringify');
var Spinner = require('cli-spinner').Spinner;
var ProgressBar = require('progress');

var fakeRequest = {type: 'script'};
let fakeTab = {
    tabId: 0,
    url: 'http://test.com',
    site: {domain: 'test.com'}
}

var noopFunc = function () {}

/*
 * Fake chrome api. We don't need any of this to test trackers.js
 */
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

/*
 * For some reason loading modules in tracker.js doesn't work corectly when running
 * this in node. I removed them from trackers.js and included some of them here as global
 */
const settings = require('./settings.js')
const constants = require('./../data/constants.js')
const load = require('./load.js')
const {isTracker} = require('./trackers.js')
global.trackerLists = require('./trackerLists').getLists()
global.abp = require('abp-filter-parser')
global.abpLists = require('./abp-preprocessed.es6')

let filename = process.argv[2]
console.log(`Loading file ${filename}`)

let outputname = process.argv[3]

// load the test data
const requestLog = require('./' + filename)
// try to wait for settings to load. We don't need to use settings
// but it will complain if we try to access it before it's ready. 
// not sure this works anyway...
async function waitForSettings() {
    await settings.ready().then()
}

var spinner = new Spinner(`Replaying ${requestLog.ddglog.length} requests`);
spinner.setSpinnerString('◐◓◑◒');
spinner.start()

// Load entiymap and entitylist here as globals
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

const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length
let testResults = {
    results:[], 
    blockedTimes: [],
    notblockedTimes: [],
    blockedDDG: 0, 
    blockedOther: 0,
    filters: {}
}

function runtests () {
    spinner.stop()

    requestLog.ddglog.forEach((r) => { 
        fakeTab.url = r.frameUrl
        fakeTab.site.domain = r.frameDomain
        fakeRequest.type = r.requestType

        perf.start()
        let tracker = isTracker(r.requestUrl, fakeTab, fakeRequest)
        let result = perf.stop()
        
        if (r.requestRule) {
            if (testResults.filters[r.requestRule.ruleText]) {
                testResults.filters[r.requestRule.ruleText]++
            } else {
                testResults.filters[r.requestRule.ruleText] = 1
            }
            ++testResults.blockedOther
        }
        
        testResults.results.push([r.frameDomain, r.requestUrl, result.time, tracker ? 1 : 0, r.requestRule ? 1 : 0, r.requestRule ? r.requestRule.ruleText : ''])

        if (tracker) {
            testResults.blockedTimes.push(result.time)
            ++testResults.blockedDDG
        } else {
            testResults.notblockedTimes.push(result.time)
        }

    })
    
    // print out some results
    console.log(`\n*************************************************`)
    console.log(`Block average: ${average(testResults.blockedTimes)}`)
    console.log(`Block Max: ${Math.max(...testResults.blockedTimes)}`)
    console.log(`No Block average: ${average(testResults.notblockedTimes)}`)
    console.log(`No Block Max: ${Math.max(...testResults.notblockedTimes)}`)
    console.log(`DDG Blocked: ${testResults.blockedDDG}, ${testResults.blockedDDG/requestLog.ddglog.length*100}%`)
    console.log(`${outputname} Blocked: ${testResults.blockedOther}, ${testResults.blockedOther/requestLog.ddglog.length*100}%`)


    // print out a sorted list of filters
    filtersSorted = Object.keys(testResults.filters).sort(function(a,b){return testResults.filters[b]-testResults.filters[a]})
    
    console.log(`\n*************************************************`)
    console.log("Top 10 blocked filters")
    filtersSorted.slice(0,10).forEach((f) => {
        console.log(`${f}, ${testResults.filters[f]}`)
    })

    // write a csv with all data
    let columns = {site: 'site', url: 'url', time: 'time (ms)', ddgBlocked: 'DDG Blocked', otherBlocked: `${outputname} Blocked`, filter: 'Filter'} 
    stringify(testResults.results, { header: true, columns: columns }, (err, output) => {
        if (err) throw err;
        fs.writeFile(`${outputname}.csv`, output, (err) => {
                if (err) throw err;
                console.log(`\n*************************************************`)
                console.log(`${outputname}.csv saved.`);
        })
    })

    fs.writeFile('blocking.txt', testResults.blockedTimes, (err) => console.log(err))
    fs.writeFile('nonblocking.txt', testResults.notblockedTimes, (err) => console.log(err))
}

