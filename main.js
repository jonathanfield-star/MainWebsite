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
