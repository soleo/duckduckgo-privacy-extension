const fs = require('fs');
const fileNames = process.argv.splice(2)
let last_fn
// parent company -> site
let parents = { }

// parentdomain => [ tracker url, tracker url ]
// 'Yahoo!techcrunch.com': [ 'geo.yahoo.com' ]
let parent_domain = { }
let parent_unblocked = { }

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

        // "url": "http://engadget.com"
        let url = domain(s.url)
        console.log(url)
        // let unblocked = { }
        let local_unblocked = { }

        // "Oath": {
        //     "s.yimg.com": {
        //     "parentCompany": "Oath",
        //     "url": "s.yimg.com",
        //     "type": "test",
        //     "block": false
        // },
        // k == 'Oath'
        Object.keys(s.trackers).forEach( (k) => {
            let hasPrintedParent = false

            if (!parents[k])
                parents[k] = [ ];

            if (parents[k].indexOf(url) == -1) {
                parents[k].push(url) // parents['Oath'].push('http://engadget.com')
            }

            let pd = `${k}${url}`;

            if (!parent_domain[pd])
                parent_domain[pd] = []

            if (!parent_unblocked[pd])
                parent_unblocked[pd] = []


            // for each tracker by parent
            Object.keys(s.trackers[k]).forEach( (pt) => {
                // let block_status = ''

                if (s.trackers[k][pt].block === false) {
                    // block_status = '[not blocked]'
                    if (parent_unblocked[pd].indexOf(pt) == -1) {
                        parent_unblocked[pd].push(pt)


                        if (!local_unblocked[k])
                            local_unblocked[k] = []

                        local_unblocked[k].push(pt)
                    }

                }
                else
                if (parent_domain[pd].indexOf(pt) == -1) {
                    parent_domain[pd].push(pt)

                    if (!hasPrintedParent ) { // only print the parent entity if there are blocked trackers to show
                        hasPrintedParent = true
                        console.log(`    ${k}`)
                    }

                    console.log(`        ${pt}`) //${block_status}`)
                }
            })





        })

        let unblocked_list = Object.keys(local_unblocked);
        if (unblocked_list && unblocked_list.length > 0) {
            console.log('\n–––\nUnblocked:')
            // print unblocked separately
            unblocked_list.forEach( (uparent) => {

                console.log(`   ${uparent}`)

                local_unblocked[uparent].forEach( (uu) => {
                    console.log(`        ${uu}`)
                })

            })
        }
        
        
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

