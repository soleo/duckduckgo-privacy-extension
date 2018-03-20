const fs = require('fs');
const fileNames = process.argv.splice(2)
let last_fn
// parent company -> site
let parents = { }


// parentdomain => [ tracker url, tracker url ]
// 'Yahoo!techcrunch.com': [ 'geo.yahoo.com' ]
let parent_domain = { }

let domain = (u) => {
    let m = u.match(/https?:\/\/(.+)$/);

    if (m.length > 0)
        return m[1];

    return m
}

fileNames.forEach( (fn) => {

    last_fn = fn

    const sitesArray = JSON.parse(fs.readFileSync(fn).toString())

    sitesArray.forEach( (s) => {
        // console.log(s.url)

        let url = domain(s.url)
        console.log(url)

        Object.keys(s.trackers).forEach( (k) => {
            console.log(`    ${k}`)

            if (!parents[k])
                parents[k] = [ ];

            if (parents[k].indexOf(url) == -1) {
                parents[k].push(url)
            }

            let pd = `${k}${url}`;

            if (!parent_domain[pd])
                parent_domain[pd] = []

            // for each tracker by parent
            Object.keys(s.trackers[k]).forEach( (pt) => {
                if (parent_domain[pd].indexOf(pt) == -1) {
                    parent_domain[pd].push(pt)
                    console.log(`        ${pt}`)
                }
            })
        })
        
        
    })
})

// console.log(JSON.stringify(parents))


let outfn = last_fn.match(/(.*)\.json/)

fs.writeFile(`${outfn[1]}-reverse.json`, JSON.stringify(parents), err => {
    if (err) {
        console.log(`error ${err} for ${outfn[1]}-reverse.json`)
        return
    }
})

console.log('\nReverse:')

Object.keys(parents).forEach( (k) => {
    console.log(k)

    parents[k].forEach( (u) => {
        // let us = ''
        let pd = `${k}${u}`;
        console.log(`    ${u}`)

        if (parent_domain[pd]) {
            parent_domain[pd].forEach( (pdu) => {
                console.log(`        ${pdu}`)
                // us += ` ${pdu}`
            })
        }
        // console.log(`    ${u}  [${us.trim()}]`)
    })
})

