const fs = require('fs')
const hostFilters = require('./hostfilters.json')
const blockList = require('./shared/data/tracker_lists/trackersWithParentCompany.json')
// to easily look up raw filtes later
const hostFilterMap = {}
let blockSet = new Set()
let whitelistSet = new Set()

hostFilters.map(f => {
    whitelistSet.add(f[0])
    
    if (!hostFilterMap[f[0]]) {
        hostFilterMap[f[0]] = []
    }

    hostFilterMap[f[0]].push(f[1])

})

// turn block list into set
let cats = ["Advertising","Analytics","Social","TopTrackerDomains"]
cats.map(t => {
    let hosts = Object.keys(blockList[t])
    hosts.map(h => {
        blockSet.add(h)
    })
})

// find intersection between the two sets
let intersect = intersection(blockSet, whitelistSet)

// find which raw abp filters are in the intersection
let intersectFilters = []
intersect.forEach(h => {
    hostFilterMap[h].map(f => intersectFilters.push(f))
})

fs.writeFileSync('intersectFilters.json', JSON.stringify(intersectFilters, null, 4))

function printEntries(set) {
    for (let [key, value] of set.entries()) console.log(key)
}

function intersection(setA, setB) {
    var _intersection = new Set();
    for (var elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}
