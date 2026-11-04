require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const assert = require('assert')

async function runTest() {
  console.log('--- TEST: Ingestion & Mapping of Search Scraper Data ---')
  const { mapProfileResult } = require('../server/services/apify')

  const sampleSearchItem = {
    username: 'test_influencer_nordeste',
    fullName: 'Nordeste Comédia Oficial',
    biography: 'O melhor do sertão e da vaquejada 🌵 Parcerias chama no zap wa.me/558899998888',
    followersCount: 45000,
    followsCount: 300,
    postsCount: 150,
    businessCategoryName: 'Creator',
    externalUrls: [
      {
        url: 'https://wa.me/558899998888',
        link_type: 'whatsapp'
      }
    ],
    latestPosts: [
      { videoViewCount: 12000, likesCount: 1500, commentsCount: 60 },
      { videoViewCount: 18000, likesCount: 2200, commentsCount: 85 }
    ]
  }

  const mapped = mapProfileResult(sampleSearchItem)
  assert.strictEqual(mapped.username, 'test_influencer_nordeste')
  assert.strictEqual(mapped.followers_count, 45000)
  assert.strictEqual(mapped.is_agency, false)
  assert.ok(mapped.avg_reels_views > 0, 'avg_reels_views should be computed')
  assert.ok(mapped.engagement_rate > 0, 'engagement_rate should be computed')
  console.log('✅ mapProfileResult handled search-scraper item correctly:', mapped.username, 'followers:', mapped.followers_count)

  console.log('--- TEST: Fast Bio & Link WhatsApp Extraction ---')
  const { fastInspectBio } = require('../server/services/linktree')
  const linkData = fastInspectBio(mapped.bio, mapped.external_url)
  assert.strictEqual(linkData.whatsapp, '558899998888', 'WhatsApp should be extracted from bio/urls')
  console.log('✅ fastInspectBio extracted WhatsApp:', linkData.whatsapp)

  console.log('--- TEST: SDR Scoring Engine ---')
  const { calculateScore } = require('../server/services/scoring')
  const scoreResult = calculateScore(mapped, linkData)
  assert.ok(scoreResult.score >= 50, 'Score should be high for authentic creator with WhatsApp')
  console.log('✅ calculateScore classified correctly:', scoreResult.classification, 'Score:', scoreResult.score)

  console.log('\n🎉 ALL LOGIC TESTS PASSED SUCCESSFULLY!')
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
