const getOperator = query => {
  for(const op in query) {
    return op
  }
}

const getValue = query => {
  for(const op in query) {
    return query[op]
  }
}

// Define reduce on obj
const reduce = (obj, reducer, init) => {
  let accum = init
  for(const key in obj) {
    accum = reducer(accum, obj[key], key)
  }
  return accum
}

// Simple get impl (Only supports dot notation)
// obj = {a:{b:{c:42}}}; get(obj, 'a.b.c') -> 42
const get = (obj, path) => {
  const parts = path.split('.')
  if(parts.length > 1) {
    return get(obj[parts[0]], parts.slice(1, parts.length).join('.'))
  } else {
    return obj[path]
  }
}

const handleCase = (str, caseSensitive) => caseSensitive ? str : str.toUpperCase()

const operators = {
  // comparison operators
  '$eq': (col, val) => row => get(row, col) === val,
  '$gt': (col, val) => row => get(row, col) > val,
  '$gte': (col, val) => row => operators['$eq'](col, val)(row) || operators['$gt'](col, val)(row),
  '$lt': (col, val) => row => get(row, col) < val,
  '$lte': (col, val) => row => operators['$eq'](col, val)(row) || operators['$lt'](col, val)(row),
  '$ne': (col, val) => row => !operators['$eq'](col, val)(row),
  '$in': (col, values) => row => values.find(val => operators['$eq'](col, val)(row)) !== undefined,
  '$nin': (col, val) => row => !operators['$in'](col, val)(row),
  // logical operators
  '$or': subqueries => {
    const fs = subqueries.map(handleSubquery)
    return row => fs.find(f => f(row)) !== undefined
  },
  '$and': subqueries => {
    const fs = subqueries.map(handleSubquery)
    return row => fs.filter(f => f(row)).length === fs.length
  },
  '$not': subquery => row => !handleSubquery(subquery)(row),
  '$nor': subqueries => row => operators['$not']({'$or': subqueries})(row),
  // text search
  '$text': (col, searchSpec) => {
    const terms = searchSpec.$search.split(' ')
    const caseSpec = searchSpec.$caseSensitive || false

    return row => {
      return terms.find(term => handleCase(get(row, col), caseSpec).includes(handleCase(term, caseSpec))) !== undefined
    }
  }
}

const handleSubquery = sub => {
  const token = getOperator(sub)
  if(isField(token)) {
    const op = getOperator(sub[token])
    return operators[op](token, getValue(sub[token]))
  } else {
    const val = sub[token]
    return operators[token](val)
  }
}

const isOperator = token => operators[token] !== undefined
const isField = token => !isOperator(token)
const isValue = value => {
  const isStrValue = typeof value === 'string'
  const isNumberValue = typeof value === 'number'

  // value is e.g. date and not something like {'$eq': 'foo'}
  const isNotQuery = (typeof value === 'object') && Object.keys(value).find(isOperator) === undefined

  return isStrValue || isNumberValue || isNotQuery
}

const wrapOperator = (op, value) => ({[op]: value})
const expandEq = value => wrapOperator('$eq', value)

// Preprocess query into expaned form, where each object corresponds to 1 operator
const prepareQuery = query => {
  const keys = Object.keys(query)
  const isCompound = keys.length > 1
  if(isCompound) {
    const andQuery = reduce(query, (accum, right, left) => {
      accum.push(wrapOperator(left, right))
      return accum
    }, [])

    return prepareQuery({'$and': andQuery})
  } else {
    keys.forEach(left => {
      const right = query[left]
      if(Array.isArray(right)) {
        query[left] = query[left].map(subQuery => prepareQuery(subQuery))
        return query
      } else if(isField(left) && isValue(right)) {
        query[left] = expandEq(right)
        return query
      }
    })
  }

  return query
}

const gen = query => reduce(query, (accum, right, left) => accum.concat(handleSubquery({[left]:right})), [])

export const compile = (query, analyze = () => true, optimize = query => query) => {
  const prepared = prepareQuery(query)
  if(analyze(prepared)) {
    return gen(optimize(prepared))
  } else {
    // report errors and return empty query funcs
    return []
  }
}
