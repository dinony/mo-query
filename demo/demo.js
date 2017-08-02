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

const printHeader = () => console.log(`ID\tNAME\tAGE\tPOINTS`)
const printPlayer = p => console.log(`${p.id}\t${p.name}\t${p.age}\t${p.points}`)

init.then(({compile}) => {
  const predFuncs = compile(query)
  const filterFunc = row => predFuncs.find(p => !p(row)) === undefined
  const queried = players.filter(filterFunc)

  console.log(`Results: ${queried.length}`)
  printHeader()
  queried.forEach(printPlayer)
}).catch(console.log)