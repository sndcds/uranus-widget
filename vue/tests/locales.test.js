import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CATEGORIES } from '../src/lib/constants.js'

for (const language of ['de', 'en', 'da', 'es']) {
  test(`${language} provides a label for every filter category`, () => {
    const messages = JSON.parse(readFileSync(new URL(`../src/locales/${language}.json`, import.meta.url), 'utf8'))
    for (const { id } of CATEGORIES) {
      assert.equal(typeof messages.categories[id], 'string', `Missing categories.${id}`)
      assert.ok(messages.categories[id].trim(), `Empty categories.${id}`)
    }
  })
}
