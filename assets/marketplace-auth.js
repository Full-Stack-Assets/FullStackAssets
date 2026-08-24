import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/+esm';

const SUPABASE_URL='https://fbwoqjxgyczsyjkbglbb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_iAZSVimTUI8i7zjYkbIREA_AHDEHLCl';
export const API_BASE=`${SUPABASE_URL}/functions/v1/marketplace-api`;
const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

export async function getSession(){const {data,error}=await client.auth.getSession();if(error)throw error;return data.session;}
export async function authFetch(path,init={}){const session=await getSession();const headers=new Headers(init.headers||{});headers.set('accept',headers.get('accept')||'application/json');if(session?.access_token)headers.set('Authorization',`Bearer ${session.access_token}`);return fetch(`${API_BASE}${path}`,{...init,headers});}
export async function signOut(){await client.auth.signOut();}

function authHost(){return document.querySelector('[data-my-library],[data-publisher-studio],[data-enterprise-registry],[data-marketplace-acquire-host]');}
function render(session){const host=authHost();if(!host)return;let box=host.querySelector('[data-marketplace-auth]');if(!box){box=document.createElement('section');box.dataset.marketplaceAuth='';box.className='wrap marketplace-auth';host.prepend(box);}box.innerHTML='';const status=document.createElement('p');status.setAttribute('aria-live','polite');box.append(status);if(session){status.textContent=`Signed in as ${session.user?.email||'authorized user'}`;const button=document.createElement('button');button.type='button';button.textContent='Sign out';button.addEventListener('click',async()=>{await signOut();render(null);window.dispatchEvent(new Event('marketplace-auth-change'));});box.append(button);return;}status.textContent='Sign in to access private marketplace features.';const form=document.createElement('form');const email=document.createElement('input');email.type='email';email.required=true;email.autocomplete='email';email.placeholder='Email';email.setAttribute('aria-label','Email');const button=document.createElement('button');button.type='submit';button.textContent='Email me a sign-in link';form.append(email,button);form.addEventListener('submit',async(event)=>{event.preventDefault();button.disabled=true;status.textContent='Sending sign-in link…';const {error}=await client.auth.signInWithOtp({email:email.value.trim(),options:{shouldCreateUser:false,emailRedirectTo:`${location.origin}${location.pathname}`}});status.textContent=error?`Sign-in failed: ${error.message}`:'Check your email for the sign-in link.';button.disabled=false;});box.append(form);}

const ready=(async()=>{const session=await getSession().catch(()=>null);render(session);client.auth.onAuthStateChange((_event,next)=>{render(next);window.dispatchEvent(new Event('marketplace-auth-change'));});return session;})();
export {client,ready};
window.marketplaceAuth={API_BASE,client,getSession,authFetch,signOut,ready};
window.dispatchEvent(new Event('marketplace-auth-ready'));
