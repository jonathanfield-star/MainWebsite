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
