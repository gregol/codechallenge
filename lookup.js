// A column-major data structure is an efficient way of storing tabular data.
// A typical JavaScript implementation uses an object of arrays.

const table = {
  name: ['alice', 'bob', 'charly'],
  age: [25, 50, 30],
  email: ['alice@gmail.com', null, 'charly@gmail.com']
}

// A lookup is analogous to Array.prototype.find for tables.
// Given a column and a known value, return the value from desiredKey in the first matching row.
// lookup(table, 'name', 'bob', 'age') returns 50.
// lookup(table, 'email', 'charly@gmail.com', 'name') returns 'charly'.

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

export const lookup = (table, column, knownValue, desiredKey) => {
  if (table == null || !hasOwn(table, column) || !hasOwn(table, desiredKey)) {
    return undefined
  }

  const searchValues = table[column]
  const desiredValues = table[desiredKey]
  if (!Array.isArray(searchValues) || !Array.isArray(desiredValues)) {
    return undefined
  }

  const length = searchValues.length
  for (let index = 0; index < length; index++) {
    if (hasOwn(searchValues, index) && searchValues[index] === knownValue) {
      return hasOwn(desiredValues, index) ? desiredValues[index] : undefined
    }
  }

  return undefined
}
