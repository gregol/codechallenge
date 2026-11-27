import assert from 'node:assert/strict'
import test from 'node:test'
import { lookup } from './lookup.js'

test('returns the corresponding cell and preserves null, false and zero', () => {
  const table = {
    name: ['alice', 'bob', 'charly', 'dana'],
    value: [25, null, false, 0]
  }

  assert.strictEqual(lookup(table, 'name', 'alice', 'value'), 25)
  assert.strictEqual(lookup(table, 'name', 'bob', 'value'), null)
  assert.strictEqual(lookup(table, 'name', 'charly', 'value'), false)
  assert.strictEqual(lookup(table, 'name', 'dana', 'value'), 0)
})

test('uses strict equality and returns the first duplicate', () => {
  const table = { key: ['1', 1, 1, NaN], value: ['string', 'first', 'second', 'nan'] }

  assert.strictEqual(lookup(table, 'key', 1, 'value'), 'first')
  assert.strictEqual(lookup(table, 'key', '1', 'value'), 'string')
  assert.strictEqual(lookup(table, 'key', NaN, 'value'), undefined)
})

test('returns undefined when no row matches', () => {
  const table = { name: ['alice'], value: [25] }

  assert.strictEqual(lookup(table, 'name', 'bob', 'value'), undefined)
})

test('returns undefined when either requested column is missing, inherited or not an array', () => {
  const table = Object.assign(Object.create({ inherited: ['alice'] }), {
    name: ['alice'],
    value: [25],
    arrayLike: { 0: 'alice', length: 1 },
    text: 'alice',
    empty: null
  })

  for (const key of ['missing', 'inherited', 'arrayLike', 'text', 'empty']) {
    assert.strictEqual(lookup(table, key, 'alice', 'value'), undefined, `search column: ${key}`)
    assert.strictEqual(lookup(table, 'name', 'alice', key), undefined, `destination column: ${key}`)
  }
})

test('skips inherited search indices', () => {
  const key = new Array(2)
  const prototype = Object.create(Array.prototype)
  prototype[0] = 'match'
  Object.setPrototypeOf(key, prototype)
  key[1] = 'match'
  const table = { key, value: ['inherited index', 'own index'] }

  assert.strictEqual(lookup(table, 'key', 'match', 'value'), 'own index')
  delete key[1]
  assert.strictEqual(lookup(table, 'key', 'match', 'value'), undefined)
})

test('skips holes and inherited undefined but matches an own undefined', () => {
  const key = new Array(3)
  const prototype = Object.create(Array.prototype)
  prototype[1] = undefined
  Object.setPrototypeOf(key, prototype)
  const table = { key, value: ['hole', 'inherited undefined', 'own undefined'] }

  assert.strictEqual(lookup(table, 'key', undefined, 'value'), undefined)
  key[2] = undefined
  assert.strictEqual(lookup(table, 'key', undefined, 'value'), 'own undefined')
})

test('stops at the first match when its destination cell is missing or inherited', () => {
  const value = new Array(2)
  value[1] = 'later duplicate'
  const table = { key: ['match', 'match'], value }

  assert.strictEqual(lookup(table, 'key', 'match', 'value'), undefined)

  const prototype = Object.create(Array.prototype)
  prototype[0] = 'inherited destination'
  Object.setPrototypeOf(value, prototype)

  assert.strictEqual(lookup(table, 'key', 'match', 'value'), undefined)
})

test('looks up rows in a frozen table without mutating either column', () => {
  const table = Object.freeze({
    key: Object.freeze(['bob', 'alice', 'bob']),
    value: Object.freeze([50, 25, 60])
  })

  assert.strictEqual(lookup(table, 'key', 'bob', 'value'), 50)
  assert.strictEqual(lookup(table, 'key', 'missing', 'value'), undefined)
  assert.deepStrictEqual(table, { key: ['bob', 'alice', 'bob'], value: [50, 25, 60] })
})

test('observes edits to each column and array replacements on subsequent calls', () => {
  const table = { key: ['alice', 'bob'], value: [25, 50] }

  assert.strictEqual(lookup(table, 'key', 'bob', 'value'), 50)

  table.key[0] = 'bob'
  assert.strictEqual(lookup(table, 'key', 'bob', 'value'), 25)

  table.value[0] = 30
  assert.strictEqual(lookup(table, 'key', 'bob', 'value'), 30)

  table.key = ['bob']
  table.value = [40]
  assert.strictEqual(lookup(table, 'key', 'bob', 'value'), 40)
})
