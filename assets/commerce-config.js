/*
  Full Stack Assets commerce configuration.

  Add a hosted checkout URL for each fixed-price offer when your payment
  processor is ready. Stripe Payment Links are recommended because they keep
  card data off this site and support cards, Apple Pay, and Google Pay.

  Leave a value blank to route that offer through the invoice / ACH request
  flow instead. No fabricated or test payment URLs are included.
*/
window.FSA_COMMERCE = Object.freeze({
  currency: 'USD',
  salesEmail: 'hello@fullstackassets.com',
  checkoutLinks: Object.freeze({
    audit: '',
    'launch-kit': '',
    'build-sprint': '',
    'fractional-engineer': '',
    'content-engine': '',
    'eval-harness': '',
    'source-license': ''
  })
});
