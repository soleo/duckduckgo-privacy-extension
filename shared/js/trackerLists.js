const constants = require('../data/constants')
const fs = require('fs')

let lists = {}

function getLists () {
    return lists
}

function setList (name, data) {
    lists[name] = data
}

function loadLists(){
    var listLocation = constants.trackerListLoc
    var blockLists = constants.blockLists
    blockLists.forEach( function(listName) {
        fs.readFile("../" + listLocation + "/" + listName, (err, data) => {
            if (!err) {
                //console.log(`Loaded tracker list: ${listLocation}/${listName}`)
                lists[listName.replace('.json', '')] = JSON.parse(data)
            } else {
                console.log(err)
            }
        })
    })
}

loadLists()

module.exports = {
    getLists: getLists
}
