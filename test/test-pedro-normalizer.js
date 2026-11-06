const assert = require('assert')
const {
  normalizeUsername,
  normalizePhone,
  normalizeGame,
  normalizeClosure,
  normalizePaymentAndReferral,
  formatPhoneBR,
  buildInitialDatabase,
} = require('../server/services/importer')

console.log('--- TEST: Normalization Rules for Pedro Data ---')

// 1. Username
assert.strictEqual(normalizeUsername('@EuGael '), 'eugael')
assert.strictEqual(normalizeUsername('  @nenendograu244  '), 'nenendograu244')
assert.strictEqual(normalizeUsername(''), '')
console.log('✅ normalizeUsername: ok')

// 2. Phone
assert.strictEqual(normalizePhone('73998312396'), '73998312396')
assert.strictEqual(normalizePhone('62 992586817'), '62992586817')
assert.strictEqual(normalizePhone('11 982490861 '), '11982490861')
assert.strictEqual(normalizePhone('85982197809.0'), '85982197809')
assert.strictEqual(normalizePhone("''''''''''"), null)
assert.strictEqual(normalizePhone(''), null)
console.log('✅ normalizePhone: ok')

// 3. Format Phone BR
assert.strictEqual(formatPhoneBR('71981916153'), '(71) 98191-6153')
console.log('✅ formatPhoneBR: ok')

// 4. Game normalization
assert.strictEqual(normalizeGame('BlockWin'), 'Block Win')
assert.strictEqual(normalizeGame('blockwin'), 'Block Win')
assert.strictEqual(normalizeGame('Bubblewin'), 'Bubble Win')
assert.strictEqual(normalizeGame('Count masters'), 'Count Masters')
assert.strictEqual(normalizeGame('Cust Win'), 'Cust Win')
console.log('✅ normalizeGame: ok')

// 5. Closure types
const c1 = normalizeClosure('Fixo')
assert.strictEqual(c1.type, 'Fixo')
assert.strictEqual(c1.isGhost, false)

const c2 = normalizeClosure('Fixo (GHOST)')
assert.strictEqual(c2.type, 'Fixo')
assert.strictEqual(c2.isGhost, true)

const c3 = normalizeClosure('50 DEPOSITANTES')
assert.strictEqual(c3.type, 'Por meta')
assert.strictEqual(c3.targetDepositors, 50)
console.log('✅ normalizeClosure: ok')

// 6. Coluna 1 & Referral
const p1 = normalizePaymentAndReferral('x')
assert.strictEqual(p1.paymentStatus, 'Pago')
assert.strictEqual(p1.referralCommission, 0)

const p2 = normalizePaymentAndReferral('Indicação do Jhon (R$50)')
assert.strictEqual(p2.referralName, 'Jhon')
assert.strictEqual(p2.referralCommission, 50)
console.log('✅ normalizePaymentAndReferral: ok')

// 7. Initial Database Seed Build
console.log('--- TEST: Initial Database Generation ---')
const db = buildInitialDatabase()
console.log('Generated influencers count:', db.influencers.length)
console.log('Generated publicidades count:', db.publicidades.length)
console.log('Generated metas count:', db.metas.length)

assert.ok(db.influencers.length >= 80, 'Should have >= 80 influencers')
assert.strictEqual(db.publicidades.length, 18, 'Should have 18 publicidades')
assert.strictEqual(db.metas.length, 11, 'Should have 11 metas')
console.log('✅ buildInitialDatabase: ok')

console.log('\n🎉 ALL PEDRO NORMALIZER & SEED TESTS PASSED!')
