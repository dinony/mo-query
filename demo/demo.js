const init = require('./init')
const players = require('./players.json')

// Follows MongoDB Query spec with limitations:
//  - Only supports comparison and logical operators
const query = {
  name: 'Onur',
  $or: [
    {age: {$lt: 18}},
    {
      $and: [
        {points: {$gt:700}},
        {age: {$gte: 50}}
      ]
    }
  ]
}

// Supports text search similar to MongoDB
// - $caseSensitive is false by default
// const query = {
//   name: {
//     $text: {
//       $search: 'lorena OnUr',
//     }
//   }
// }

const log = console.log // eslint-disable-line no-console
const printHeader = () => log('ID\tNAME\tAGE\tPOINTS')
const printPlayer = p => log(`${p.id}\t${p.name}\t${p.age}\t${p.points}`)

init.then(({compile}) => {
  const predFuncs = compile(query)
  const filterFunc = row => predFuncs.find(p => !p(row)) === undefined
  const queried = players.filter(filterFunc)

  log(`Results: ${queried.length}`)
  printHeader()
  queried.forEach(printPlayer)
}).catch(log)
