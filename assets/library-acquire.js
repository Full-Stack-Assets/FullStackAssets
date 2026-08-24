import {authFetch,ready} from '/assets/marketplace-auth.js';

await ready;
for(const button of document.querySelectorAll('[data-free-acquire]')){
  button.addEventListener('click',async()=>{
    const offerId=button.dataset.offerId;
    if(!offerId)return;
    const prior=button.textContent;button.disabled=true;button.textContent='Adding…';
    let status=button.parentElement?.querySelector('[data-free-acquire-status]');
    if(!status){status=document.createElement('span');status.dataset.freeAcquireStatus='';status.setAttribute('aria-live','polite');button.insertAdjacentElement('afterend',status);}
    try{
      const response=await authFetch('/v1/acquire/free',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({offerId})});
      if(response.status===401){status.textContent=' Sign in above to add this product.';return;}
      if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body?.error?.code||`HTTP_${response.status}`);}
      status.textContent=' Added to My Library.';button.textContent='Added';
      const link=document.createElement('a');link.href='/my-library/';link.textContent='Open My Library';link.className='btn btn-ghost';button.insertAdjacentElement('afterend',link);return;
    }catch(error){status.textContent=` Could not add: ${error.message}`;}
    finally{if(button.textContent!=='Added'){button.disabled=false;button.textContent=prior;}}
  });
}
