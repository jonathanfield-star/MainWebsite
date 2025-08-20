/* ============================================================
   Open Energy Modeling – site interactivity
   - Mobile nav toggle
   - Dark mode toggle with localStorage
   - Filterable model cards (home)
   - Projects page: tag + text search filter
   - Scroll-to-top + reveal-on-scroll
   - Copy snippet helper
   - Case study renderer (reads JSON from #case-data in case-study.html)
   ============================================================ */

// Mobile nav
const navToggle = document.querySelector(".nav-toggle");
const navList = document.querySelector(".nav-list");
if (navToggle && navList) {
  navToggle.addEventListener("click", () => {
    const open = navList.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// Theme toggle
const root = document.documentElement;
const themeBtn = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("theme");
if (savedTheme) root.setAttribute("data-theme", savedTheme);
function toggleTheme() {
  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  if (themeBtn) themeBtn.textContent = next === "dark" ? "☾" : "☀︎";
}
if (themeBtn) {
  themeBtn.textContent = (root.getAttribute("data-theme") === "dark") ? "☾" : "☀︎";
  themeBtn.addEventListener("click", toggleTheme);
}

// Set year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Home: filterable models ----------
(function initHomeFilters(){
  const section = document.querySelector("#models");
  if (!section) return;
  const filterChips = section.querySelectorAll(".filters .chip");
  const modelCards = section.querySelectorAll(".model");

  function applyFilter(tag) {
    modelCards.forEach(card => {
      const tags = (card.getAttribute("data-tags") || "").split(/\s+/);
      const show = tag === "all" || tags.includes(tag);
      card.style.display = show ? "" : "none";
    });
    // NEW: tell the pager things changed
    document.dispatchEvent(new CustomEvent("portfolio:filter", { detail: { tag } }));
  }

  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      applyFilter(chip.dataset.filter);
    });
  });
})();

// ---------- Projects page: filters + search ----------
(function initProjectsPage(){
  const grid = document.getElementById("projects-grid");
  if (!grid) return;
  const chips = document.querySelectorAll(".filters .chip[data-filter]");
  const search = document.getElementById("project-search");
  const cards = grid.querySelectorAll(".project");

  let activeTag = "all";
  let term = "";

  function visible(card) {
    const tags = (card.getAttribute("data-tags") || "").split(/\s+/);
    const text = (card.getAttribute("data-title") + " " + card.getAttribute("data-desc")).toLowerCase();
    const tagOk = activeTag === "all" || tags.includes(activeTag);
    const searchOk = !term || text.includes(term);
    return tagOk && searchOk;
  }
  function apply() {
    cards.forEach(c => { c.style.display = visible(c) ? "" : "none"; });
  }
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      activeTag = chip.dataset.filter;
      apply();
    });
  });
  if (search) {
    search.addEventListener("input", (e) => {
      term = (e.target.value || "").trim().toLowerCase();
      apply();
    });
  }
})();

// Back to top
const toTop = document.querySelector(".to-top");
const toggleToTop = () => {
  if (!toTop) return;
  if (window.scrollY > 400) toTop.classList.add("is-visible");
  else toTop.classList.remove("is-visible");
};
window.addEventListener("scroll", toggleToTop);
if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Reveal-on-scroll
const revealables = document.querySelectorAll(".card, .step, .faq-item");
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
revealables.forEach(el => io.observe(el));

// Copy snippet delegate
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
  const target = document.querySelector(btn.getAttribute("data-copy"));
  const text = (target && target.textContent.trim()) || "";
  try {
    await navigator.clipboard.writeText(text);
    const prev = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = prev), 1200);
  } catch { alert("Copy failed, please copy manually."); }
});

// ---------- Case study renderer ----------
(function initCaseStudy(){
  const mount = document.getElementById("case-root");
  if (!mount) return;

  // Read dataset from inline JSON on the page
  let dataset = { order: [], items: {} };
  const dataEl = document.getElementById("case-data");
  if (dataEl) {
    try { dataset = JSON.parse(dataEl.textContent); } catch {}
  }

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug") || dataset.order[0] || Object.keys(dataset.items)[0];
  const cs = dataset.items[slug];
  if (!cs) return;

  // Update hero/title/tags/KPIs
  const titleEl = document.getElementById("case-title");
  const crumbTitle = document.getElementById("crumb-title");
  const subtitleEl = document.getElementById("case-subtitle");
  const tagsEl = document.getElementById("case-tags");
  const kpisEl = document.getElementById("case-kpis");
  if (titleEl) titleEl.textContent = cs.title;
  if (crumbTitle) crumbTitle.textContent = cs.title;
  if (subtitleEl) subtitleEl.textContent = cs.subtitle || "";
  if (tagsEl && Array.isArray(cs.tags)) {
    tagsEl.innerHTML = cs.tags.map(t => `<li class="badge">${t}</li>`).join("");
  }
  if (kpisEl && Array.isArray(cs.kpis)) {
    kpisEl.innerHTML = cs.kpis.map(k => `
      <div class="kpi"><span class="kpi-num">${k.num}</span><span class="kpi-txt">${k.txt}</span></div>
    `).join("");
  }

  // Summary block (left) + code/figure (right)
  const summaryEl = document.getElementById("case-summary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div>
        <div class="card">
          <div class="card-body">
            <h3 class="card-title">Summary</h3>
            <p class="card-text">${cs.summary || ""}</p>
          </div>
          <div class="card-actions">
            <a class="btn" href="index.html#contact">Work with me</a>
            <a class="btn btn-ghost" href="projects.html">Back to Projects</a>
          </div>
        </div>
      </div>
      <div>
        <div class="glass card code-card">
          <pre><code>${(cs.code || "").replace(/</g,"&lt;")}</code></pre>
          <div class="card-footer">
            <button class="btn btn-ghost small" data-copy="#copy-text">Copy snippet</button>
            <span id="copy-text" class="sr-only">${(cs.code || "")}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Sections
  const sectionsEl = document.getElementById("case-sections")?.querySelector(".container");
  if (sectionsEl && Array.isArray(cs.sections)) {
    sectionsEl.innerHTML = cs.sections.map(([h, p]) => `
      <div class="card" style="margin-bottom:1rem;">
        <div class="card-body">
          <h3 class="card-title">${h}</h3>
          <p class="card-text">${p}</p>
        </div>
      </div>
    `).join("");
  }

  // Prev/Next links
  const order = dataset.order || [];
  const i = Math.max(0, order.indexOf(slug));
  const prev = order[(i - 1 + order.length) % order.length];
  const next = order[(i + 1) % order.length];
  const prevLink = document.getElementById("prev-link");
  const nextLink = document.getElementById("next-link");
  if (prevLink && dataset.items[prev]) {
    prevLink.href = `case-study.html?slug=${encodeURIComponent(prev)}`;
    prevLink.textContent = `← ${dataset.items[prev].title}`;
  }
  if (nextLink && dataset.items[next]) {
    nextLink.href = `case-study.html?slug=${encodeURIComponent(next)}`;
    nextLink.textContent = `${dataset.items[next].title} →`;
  }

  // Doc title
  document.title = `${cs.title} — Case Study`;
})();
// ===== Principles carousel (circular with highlighted center) =====
(function initPrinciplesCarousel(){
  const view = document.getElementById('principles-view');
  const track = document.getElementById('principles-track');
  const prev = document.getElementById('p-prev');
  const next = document.getElementById('p-next');
  if (!view || !track) return;

  // Build slides + clones for circular effect
  const originals = Array.from(track.children);
  const N = originals.length;
  const CLONES = Math.min(2, N); // clone 2 at each end (or fewer if small set)

  function cloneEnds() {
    const first = originals.slice(0, CLONES).map(li => li.cloneNode(true));
    const last  = originals.slice(-CLONES).map(li => li.cloneNode(true));
    last.forEach(li => track.insertBefore(li, track.firstChild));
    first.forEach(li => track.appendChild(li));
  }
  cloneEnds();

  // Working list of ALL slides (with clones)
  let slides = Array.from(track.children);

  // Accessibility labels
  slides.forEach((li, idx) => {
    const slide = li.querySelector('.p-card');
    if (slide) {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${((idx - CLONES + N) % N) + 1} of ${N}`);
    }
  });

  // Helpers
  const gapPx = () => parseFloat(getComputedStyle(track).gap || "16");
  const cardWidth = () => {
    const el = track.querySelector('.p-card');
    return el ? el.getBoundingClientRect().width : 380;
  };
  const step = () => cardWidth() + gapPx();

  // Center slide i (index within ALL slides)
  function centerOn(i, smooth = true) {
    const target = slides[i];
    if (!target) return;
    const left = target.offsetLeft - (view.clientWidth - target.clientWidth) / 2;
    view.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    markActiveByCenterSoon();
    currentIndex = i;
  }

  // Find the slide nearest the viewport center and mark it active
  function markActiveByCenter() {
    const mid = view.scrollLeft + view.clientWidth / 2;
    let bestIdx = 0, bestDist = Infinity;
    slides.forEach((li, idx) => {
      const rect = li.getBoundingClientRect();
      const left = rect.left + window.scrollX - view.offsetLeft; // align with scroll space
      const center = (li.offsetLeft + li.clientWidth / 2);
      const dist = Math.abs(center - (view.scrollLeft + view.clientWidth / 2));
      if (dist < bestDist) { bestDist = dist; bestIdx = idx; }
    });
    slides.forEach(li => li.querySelector('.p-card')?.classList.remove('is-active'));
    slides[bestIdx]?.querySelector('.p-card')?.classList.add('is-active');
    return bestIdx;
  }
  const markActiveByCenterSoon = () => setTimeout(markActiveByCenter, 80);

  // After smooth scroll finishes, snap-correct if we are on a clone (loop)
  function handleLoop() {
    const activeIdx = markActiveByCenter();
    const i0 = CLONES;
    const iN = CLONES + N - 1;

    if (activeIdx < i0) {
      // jumped into left clones → map to real slide at end
      const mapped = activeIdx + N;
      centerOn(mapped, false);
    } else if (activeIdx > iN) {
      // jumped into right clones → map to real slide at start
      const mapped = activeIdx - N;
      centerOn(mapped, false);
    }
  }

  // Arrow controls
  let currentIndex = CLONES; // start on first real slide
  function move(dir) {
    const nextIdx = currentIndex + dir;
    centerOn(nextIdx, true);
  }
  prev?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));

  // Keyboard
  view.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); move(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
  });

  // Update on scroll/resize
  view.addEventListener('scroll', () => {
    markActiveByCenterSoon();
    // use a lightweight loop check after smooth scrolling settles
    window.clearTimeout(view._loopT);
    view._loopT = setTimeout(handleLoop, 160);
  });
  window.addEventListener('resize', () => centerOn(markActiveByCenter(), false));

  // Initial position: highlight the first principle (“Open & democratized”)
  centerOn(currentIndex, false);
})();
// Contact form (Formspree AJAX)
(function(){
  const form = document.getElementById('contact-form');
  if (!form) return;
  const statusEl = document.getElementById('form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Sending…';
    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (resp.ok) {
        form.reset();
        statusEl.textContent = 'Thanks — your message was sent.';
      } else {
        const data = await resp.json().catch(() => null);
        statusEl.textContent = (data && data.errors && data.errors[0]?.message)
          ? data.errors[0].message
          : 'Something went wrong. Please email hello@example.com.';
      }
    } catch {
      statusEl.textContent = 'Network error. Please email hello@example.com.';
    }
  });
})();
// ===== Portfolio pager (desktop: 3×2 pages; mobile falls back) =====
(function initPortfolioPager(){
  const section = document.querySelector('#models');
  if (!section) return;

  const container = section.querySelector('.container');
  const sourceGrid = container.querySelector('.cards'); // original grid
  if (!sourceGrid) return;

  // Build pager shell right after the original grid
  const wrap = document.createElement('div');
  wrap.className = 'port-wrap';
  wrap.setAttribute('aria-roledescription', 'carousel');

  const prev = document.createElement('button');
  prev.className = 'port-nav prev';
  prev.setAttribute('aria-label', 'Previous');
  prev.textContent = '←';

  const next = document.createElement('button');
  next.className = 'port-nav next';
  next.setAttribute('aria-label', 'Next');
  next.textContent = '→';

  const view = document.createElement('div');
  view.className = 'port-view';
  view.setAttribute('tabindex', '0'); // keyboard focus

  const track = document.createElement('div');
  track.className = 'port-track';

  const dots = document.createElement('div');
  dots.className = 'port-dots';
  dots.setAttribute('role', 'tablist');

  view.appendChild(track);
  wrap.appendChild(prev);
  wrap.appendChild(view);
  wrap.appendChild(next);
  wrap.appendChild(dots);

  // Insert pager after the existing grid (kept as data source)
  sourceGrid.parentNode.insertBefore(wrap, sourceGrid.nextSibling);

  let pageIndex = 0;
  let pageCount = 0;

  function getVisibleCards() {
    // Only use cards that are actually visible (respecting your filter chips)
    return Array.from(sourceGrid.querySelectorAll('.model'))
      .filter(card => getComputedStyle(card).display !== 'none');
  }

  function activateDot(i) {
    dots.querySelectorAll('.port-dot').forEach((d, idx) => {
      d.classList.toggle('is-active', idx === i);
    });
  }

  function scrollToPage(i) {
    const slide = track.children[i];
    if (!slide) return;
    view.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
  }

  function rebuild() {
    const desktop = window.matchMedia('(min-width: 960px)').matches;

    // Reset UI
    track.innerHTML = '';
    dots.innerHTML = '';

    if (!desktop) {
      // Show original grid on mobile/tablet
      sourceGrid.style.display = '';
      return;
    }

    // Desktop: hide source grid, use pager
    sourceGrid.style.display = 'none';

    const cards = getVisibleCards();
    pageCount = Math.max(1, Math.ceil(cards.length / 6));
    for (let p = 0; p < pageCount; p++) {
      const slide = document.createElement('div');
      slide.className = 'port-slide';

      const grid = document.createElement('div');
      grid.className = 'grid-3 cards';

      cards.slice(p * 6, (p + 1) * 6).forEach(card => {
        grid.appendChild(card.cloneNode(true)); // clone; keep source untouched
      });

      slide.appendChild(grid);
      track.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = 'port-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to page ${p + 1}`);
      dot.addEventListener('click', () => scrollToPage(p));
      dots.appendChild(dot);
    }

    pageIndex = 0;
    activateDot(0);
    view.scrollTo({ left: 0, behavior: 'auto' });
  }

  // Nav
  prev.addEventListener('click', () => {
    if (pageIndex > 0) scrollToPage(pageIndex - 1);
  });
  next.addEventListener('click', () => {
    if (pageIndex < pageCount - 1) scrollToPage(pageIndex + 1);
  });

  // Update active dot on scroll end
  view.addEventListener('scroll', () => {
    window.clearTimeout(view._snapT);
    view._snapT = setTimeout(() => {
      const idx = Math.round(view.scrollLeft / view.clientWidth);
      if (idx !== pageIndex) {
        pageIndex = idx;
        activateDot(idx);
      }
    }, 80);
  });

  // Rebuild when:
  rebuild();
  window.addEventListener('resize', rebuild);

  // …filters change (hook the existing chips too)
  section.querySelectorAll('.filters .chip').forEach(chip => {
    chip.addEventListener('click', () => setTimeout(rebuild, 0));
  });

  // Expose a manual hook if you ever need it
  window.portfolioPager = { rebuild };
})();
// ---- Portfolio: mobile-only carousel pager (first 6 visible items) ----
(function initMobilePortfolioPager(){
  const cards = document.querySelector('#models .cards');
  if (!cards) return;

  const isNarrow = () => window.matchMedia('(max-width: 720px)').matches;

  function visibleModels() {
    return Array.from(cards.children).filter(el =>
      el.classList?.contains('model') &&
      getComputedStyle(el).display !== 'none'
    );
  }

  function applyMobileLimit() {
    const list = visibleModels();
    // reset any previous hiding
    Array.from(cards.children).forEach(el => el.classList?.remove('mobi-hide'));
    if (!isNarrow()) return;
    // hide anything after the first 6 *visible* items
    list.slice(6).forEach(el => el.classList.add('mobi-hide'));
  }

  function removePager() {
    if (cards.nextElementSibling?.classList?.contains('mob-pager')) {
      cards.nextElementSibling.remove();
    }
  }

  function buildPager() {
    removePager();
    if (!isNarrow()) return;

    const list = visibleModels().filter(el => !el.classList.contains('mobi-hide'));
    if (list.length <= 1) return;

    const pager = document.createElement('div');
    pager.className = 'mob-pager';
    list.forEach(() => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'mob-dot';
      pager.appendChild(dot);
    });
    cards.after(pager);

    const dots = pager.querySelectorAll('.mob-dot');

    const setActive = () => {
      if (!dots.length) return;
      // pick the item whose center is nearest viewport center
      const mid = cards.scrollLeft + cards.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      list.forEach((el, idx) => {
        const center = el.offsetLeft + el.clientWidth / 2;
        const d = Math.abs(center - mid);
        if (d < bestDist) { bestDist = d; best = idx; }
      });
      dots.forEach((d, i) => d.classList.toggle('is-active', i === best));
    };

    // click a dot to jump
    dots.forEach((d, i) => d.addEventListener('click', () => {
      const target = list[i];
      if (!target) return;
      const left = target.offsetLeft - 12;
      cards.scrollTo({ left, behavior: 'smooth' });
    }));

    // keep active dot updated
    const onScroll = () => requestAnimationFrame(setActive);
    cards.addEventListener('scroll', onScroll, { passive: true });

    // initialize
    setActive();
  }

  function refresh(resetScroll = false) {
    applyMobileLimit();
    if (resetScroll) cards.scrollTo({ left: 0 });
    buildPager();
  }

  // initial mount
  refresh(true);

  // update when filters change
  document.addEventListener('portfolio:filter', () => refresh(true));

  // update on resize / breakpoint changes
  let lastNarrow = isNarrow();
  window.addEventListener('resize', () => {
    const now = isNarrow();
    if (now !== lastNarrow) {
      lastNarrow = now;
      refresh(true);
    } else {
      // width changed within same mode: still refresh in case card widths changed
      refresh(false);
    }
  });
})();
