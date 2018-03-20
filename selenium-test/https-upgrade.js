const fs = require('fs');

const fileNames = process.argv.splice(2)

const httpsa = JSON.parse(fs.readFileSync('shared/data/https.json').toString())
let https = {}

httpsa.forEach( (d) => { https[d] = true })


console.log('domain,https.json')

fileNames.forEach( (fn) => {

    const S = fs.readFileSync(fn).toString()

    let lines = S.split("\n")

    lines.forEach( (l, i) => {

        console.log(`${l},${https[l] ? 1 : 0}`)

    })

})
