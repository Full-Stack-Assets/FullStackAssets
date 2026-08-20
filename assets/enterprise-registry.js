(()=>{
  const root=document.querySelector('[data-enterprise-registry]');if(!root)return;
  const status=root.querySelector('[data-enterprise-status]');const content=root.querySelector('[data-enterprise-content]');const retry=root.querySelector('[data-enterprise-retry]');
  let lastHtml=content?.innerHTML??'';
  async function load(){
    const registryId=new URLSearchParams(location.search).get('registry');
    if(!registryId){status.textContent='Select an organization registry after sign-in.';return;}
    status.textContent='Loading';
    try{
      const meta=document.querySelector('meta[name="marketplace-api-base"]')?.content??'';
      const response=await fetch(`${meta}/v1/enterprise/registries/${encodeURIComponent(registryId)}`,{credentials:'include'});
      if(response.status===401){status.textContent='Sign in required';return;}
      if(response.status===403){status.textContent='Registry access denied';return;}
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      lastHtml=(data.entries??[]).length?`<ul>${data.entries.map((entry)=>`<li>${String(entry.product?.title??entry.product_id).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</li>`).join('')}</ul>`:'<p>No products in this registry.</p>';
      content.innerHTML=lastHtml;status.textContent='Current';retry.hidden=true;
    }catch(error){content.innerHTML=lastHtml;status.textContent='Unable to refresh private registry';retry.hidden=false;}
  }
  retry?.addEventListener('click',load);load();
})();
