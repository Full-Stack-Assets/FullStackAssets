/* Full Stack Assets — shared site behavior */
(function(){
  /* mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    const closeNav = (returnFocus = false) => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      if(returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', ()=>{
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
      closeNav();
    }));
    document.addEventListener('keydown', event=>{
      if(event.key === 'Escape' && links.classList.contains('open')) closeNav(true);
    });
  }

  /* scroll reveal */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reducedMotion){
    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    },{threshold:.12});
    document.querySelectorAll('.rv').forEach(el=>io.observe(el));
  }

  /* back to top */
  const totop = document.querySelector('.totop');
  if(totop){
    window.addEventListener('scroll', ()=>{
      totop.classList.toggle('show', window.scrollY > 700);
    }, {passive:true});
    totop.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  /* Google Ads conversion tracking for lead-intent email clicks */
  document.querySelectorAll('a[href^="mailto:hello@fullstackassets.com"]').forEach(link=>{
    link.addEventListener('click', event=>{
      if(typeof window.gtag !== 'function') return;

      event.preventDefault();
      const href = link.href;
      let navigated = false;
      const navigate = ()=>{
        if(navigated) return;
        navigated = true;
        window.location.href = href;
      };

      window.gtag('event', 'conversion', {
        send_to: 'AW-18251288079/kzn7CM69488cEI-c8v5D',
        event_callback: navigate,
        event_timeout: 1000,
      });
      setTimeout(navigate, 1200);
    });
  });

  function composeInquiry(form) {
    const data = new FormData(form);
    const lines = [
      "PROJECT INQUIRY",
      "",
      `Name: ${data.get("name") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `Company: ${data.get("company") || ""}`,
      `Current system: ${data.get("current-system") || ""}`,
      `Users: ${data.get("users") || ""}`,
      `What is failing: ${data.get("problem") || ""}`,
      `Needed outcome: ${data.get("outcome") || ""}`,
      `Timeline or constraint: ${data.get("timeline") || ""}`,
    ];
    return lines.join("\n");
  }

  document.querySelectorAll("[data-inquiry-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[aria-live]");
      if (!form.reportValidity()) return;
      const subject = encodeURIComponent("Project inquiry — Full Stack Assets");
      const body = encodeURIComponent(composeInquiry(form));
      if (status) status.textContent = "Opening your email app with the project details.";
      window.location.href = `mailto:hello@fullstackassets.com?subject=${subject}&body=${body}`;
    });
  });

  document.querySelectorAll("[data-print-resume]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });

  /* case-study / blog filter tabs */
  const tabs = document.querySelectorAll('.tab');
  if(tabs.length){
    tabs.forEach(t=>t.setAttribute('aria-pressed', t.classList.contains('active') ? 'true' : 'false'));
    tabs.forEach(tab=>{
      tab.addEventListener('click', ()=>{
        tabs.forEach(t=>{t.classList.remove('active');t.setAttribute('aria-pressed','false');});
        tab.classList.add('active');
        tab.setAttribute('aria-pressed','true');
        const cat = tab.dataset.filter;
        document.querySelectorAll('[data-cat]').forEach(card=>{
          card.classList.toggle('hidden', cat !== 'all' && card.dataset.cat !== cat);
        });
      });
    });
  }

  /* TOC active-section highlighting */
  const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if(tocLinks.length){
    const targets = Array.from(tocLinks).map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const tocIo = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        const link = document.querySelector(`.toc a[href="#${entry.target.id}"]`);
        if(!link) return;
        if(entry.isIntersecting){
          tocLinks.forEach(l=>l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, {rootMargin:'-20% 0px -70% 0px'});
    targets.forEach(t=>tocIo.observe(t));
  }

  /* share buttons */
  document.querySelectorAll('[data-share]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const kind = btn.dataset.share;
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      if(kind === 'copy'){
        navigator.clipboard?.writeText(window.location.href).then(()=>{
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(()=>btn.textContent = original, 1600);
        });
        return;
      }
      const shareUrls = {
        x: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      };
      if(shareUrls[kind]) window.open(shareUrls[kind], '_blank', 'noopener,width=600,height=520');
    });
  });
})();
