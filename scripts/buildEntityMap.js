var request = require('request'),
    fs = require('fs');




let body = fs.readFileSync('scripts/disconnect-entitylist.json').toString()

let oathSitesText = fs.readFileSync('scripts/oath-domains.txt').toString()
let oathArray = oathSitesText.split(/\r?\n/)

// request('https://raw.githubusercontent.com/mozilla-services/shavar-prod-lists/master/disconnect-entitylist.json', function (err, res, body) {

//       if (err) {
//           return console.log(err);
//       }

      let json = JSON.parse(body);
      let out = {};


      let parentMap = {

          // 'Yahoo!': 'Oath',
          // 'AOL' : 'Oath',
          // 'BrightRoll' : 'Oath'

      }

      

      for(let parent in json) {

          let parentTo = parentMap[parent] || parent

          json[parent].properties.map(url => {
              out[url] = parentTo;
          });
          json[parent].resources.map(url => {
              out[url] = parentTo;
          });
      }


      // change and add
    oathArray.map(domain => {
        if (domain && domain.length > 1)
            out[domain] = 'Oath'
    })



      // console.log(JSON.stringify(out))

      fs.writeFile('shared/data/tracker_lists/entityMap.json', JSON.stringify(out), (err) => { if(err) console.log(err)} );
// });
