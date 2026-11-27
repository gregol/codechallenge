import test from 'node:test'
import assert from 'node:assert/strict'
import { pivotRecords } from './table.js'

test('includes every column and aligns dense positions in input order', () => {
  const records = [
    { name: 'alice', active: false },
    { score: 0, active: null },
    {},
    { name: undefined, score: 12 },
    { name: 'charly' }
  ]

  assert.deepEqual(pivotRecords(records), {
    name: ['alice', undefined, undefined, undefined, 'charly'],
    active: [false, null, undefined, undefined, undefined],
    score: [undefined, 0, undefined, 12, undefined]
  })
})

test('uses only own enumerable string keys in each row', () => {
  const symbol = Symbol('ignored')
  const record = Object.create({ inherited: 'prototype value', inheritedOnly: true }, {
    hidden: { value: 'non-enumerable value' },
    hiddenOnly: { value: true },
    [symbol]: { value: true, enumerable: true }
  })
  const nullPrototypeRecord = Object.assign(Object.create(null), { visible: true })
  const columns = pivotRecords([
    record,
    { inherited: 'own value', hidden: 'enumerable value' },
    nullPrototypeRecord
  ])

  assert.deepEqual(Reflect.ownKeys(columns).sort(), ['hidden', 'inherited', 'visible'])
  assert.deepEqual(columns, {
    inherited: [undefined, 'own value', undefined],
    hidden: [undefined, 'enumerable value', undefined],
    visible: [undefined, undefined, true]
  })
})

test('defines __proto__ and constructor as own enumerable columns', () => {
  const prototypeValue = { label: 'stored value' }
  const columns = pivotRecords([
    { ['__proto__']: prototypeValue },
    { constructor: false },
    {},
    Object.assign(Object.create(null), { ['__proto__']: null, constructor: 0 })
  ])

  assert.equal(Object.getPrototypeOf(columns), Object.prototype)
  assert.deepEqual(Object.keys(columns).sort(), ['__proto__', 'constructor'])
  assert.deepEqual(columns.__proto__, [prototypeValue, undefined, undefined, null])
  assert.equal(columns.__proto__[0], prototypeValue)
  assert.deepEqual(columns.constructor, [undefined, false, undefined, 0])
})

test('preserves input order, record identities, prototypes, and property descriptors', () => {
  const prototype = Object.freeze({ inherited: true })
  const value = Object.freeze({ label: 'original' })
  const symbol = Symbol('metadata')
  const first = Object.create(prototype, {
    value: { value, enumerable: true, writable: true, configurable: true },
    hidden: { value: 'metadata', configurable: true },
    [symbol]: { value: 42, enumerable: true, configurable: true }
  })
  const second = Object.freeze({ value: null })
  const records = Object.freeze([first, second])
  const firstDescriptors = Object.getOwnPropertyDescriptors(first)
  const secondDescriptors = Object.getOwnPropertyDescriptors(second)

  const columns = pivotRecords(records)

  assert.deepEqual(columns, { value: [value, null] })
  assert.equal(columns.value[0], value)
  assert.equal(records.length, 2)
  assert.equal(records[0], first)
  assert.equal(records[1], second)
  assert.equal(Object.getPrototypeOf(first), prototype)
  assert.deepEqual(Object.getOwnPropertyDescriptors(first), firstDescriptors)
  assert.deepEqual(Object.getOwnPropertyDescriptors(second), secondDescriptors)
})

test('returns an empty object for an empty array', () => {
  const columns = pivotRecords([])

  assert.deepEqual(columns, {})
  assert.deepEqual(Reflect.ownKeys(columns), [])
})
