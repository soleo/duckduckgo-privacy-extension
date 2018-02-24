// node summarize.js file1 [file2 .. ]
// outputs two files
// file1.csv - raw data as csv columns
// file1.hist.csv - histogram of scores

const fs = require('fs')

const fileNames = process.argv.splice(2)

let hist = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]

// convenience function for formatting a csv column
const column = (s) => {
    return `${s},`
}

// column headers
let csv_text = 'domain,initial,is major,tosdr,in major,https,obscure,blocked,total,grade\n'

out_fn = '';


// each file on the command line will be summarized together
fileNames.forEach(fn => {

    out_fn = fn

    let domains = JSON.parse(fs.readFileSync(fn).toString())

    domains.forEach( (domain) => {

        let s = column(domain.url)

        // assuming that the data is in column header order
        // that is the order it is in the algorithm
        // if that changes, we need to change this, will have to order by d.why
        domain.details.forEach( (d) => {

            // for the final one we'll add the final grade as another column
            if (d.why.match(/final grade/)) {
                s += column(d.gradeindex)
                hist[d.gradeindex] += 1;
                s += d.grade
            }
            else
                s += column(d.change)
        })

        csv_text += `${s}\n`
    })

})

if (out_fn.length === 0) {
    console.log("nothing to do");
    return
}

// Create the histogram

let hist_text = 'score,total\n'

hist.forEach( (x, i) => {
    hist_text += `${i},${x}\n`
})


// write files

fs.writeFile(`${out_fn}.csv`, csv_text, err => {
    if (err) {
        console.log(`error ${err} for ${out_fn}.csv`)
        return
    }
})

fs.writeFile(`${out_fn}.hist.csv`, hist_text, err => {
    if (err) {
        console.log(`error ${err} for ${out_fn}.csv`)
        return
    }
})

