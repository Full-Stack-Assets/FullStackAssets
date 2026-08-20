import Stripe from 'stripe';
import {PaymentAdapter} from './adapter.mjs';
function required(v,n){if(!v)throw new TypeError(`${n}_REQUIRED`);return v;}
export class StripePaymentAdapter extends PaymentAdapter{
 constructor({secretKey=process.env.STRIPE_SECRET_KEY,webhookSecret=process.env.STRIPE_WEBHOOK_SECRET,client=null}={}){super();this.secretKey=required(secretKey,'STRIPE_SECRET_KEY');this.webhookSecret=required(webhookSecret,'STRIPE_WEBHOOK_SECRET');this.client=client??new Stripe(this.secretKey);}
 async createCheckout({offer,subject,successUrl,cancelUrl}){if(!offer?.provider_price_id)throw new TypeError('APPROVED_PROVIDER_PRICE_REQUIRED');const session=await this.client.checkout.sessions.create({mode:offer.offer_class==='ONE_TIME'?'payment':'subscription',line_items:[{price:offer.provider_price_id,quantity:1}],success_url:successUrl,cancel_url:cancelUrl,client_reference_id:subject.id,metadata:{offer_ref:offer.id,subject_ref:`${subject.type}:${subject.id}`}});return {provider:'STRIPE',provider_session_id:session.id,url:session.url};}
 verifyEvent({rawBody,signature}){return this.client.webhooks.constructEvent(rawBody,signature,this.webhookSecret);}
 normalizeEvent(e){const o=e?.data?.object??{};const md=o.metadata??{};return {provider_event_id:e.id,type:e.type,provider_customer_id:typeof o.customer==='string'?o.customer:o.customer?.id??null,provider_subscription_id:typeof o.subscription==='string'?o.subscription:o.subscription?.id??null,offer_ref:md.offer_ref??null,subject_ref:md.subject_ref??null,amount:o.amount_total??o.amount_paid??null,currency:o.currency?.toUpperCase?.()??null,occurred_at:new Date((e.created??0)*1000).toISOString()};}
}
