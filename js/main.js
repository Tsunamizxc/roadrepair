/* ===== АСФАЛЬТПРО — Main JS ===== */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initNavigation();
  initCompareSliders();
  initCalculators();
  initProjectsFilter();
  initContactForm();
  initScrollEffects();
  initReveal();
});

/* --- Preloader --- */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    preloader.classList.add('hidden');
    document.body.classList.add('loaded');
    const activePage = document.querySelector('.page.active');
    if (activePage) {
      const compare = activePage.querySelector('.hero__compare');
      if (compare) playRollerAnimation(compare);
    }
  }, 2000);
}

/* --- Navigation --- */
function initNavigation() {
  const header = document.getElementById('header');
  const navLinks = document.querySelectorAll('.nav__link');
  const pages = document.querySelectorAll('.page');
  const navToggle = document.getElementById('navToggle');
  const navList = document.querySelector('.nav__list');
  const logo = document.querySelector('.logo');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });
  header.classList.add('scrolled');

  function switchPage(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    navLinks.forEach(l => l.classList.remove('active'));

    const target = document.getElementById(`page-${pageId}`);
    const link = document.querySelector(`[data-nav="${pageId}"]`);
    if (target) target.classList.add('active');
    if (link) link.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    navList.classList.remove('open');
    navToggle.classList.remove('open');

    setTimeout(() => {
      const compare = target?.querySelector('.hero__compare');
      if (compare) playRollerAnimation(compare);
    }, 400);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchPage(link.dataset.nav);
    });
  });

  logo?.addEventListener('click', e => {
    e.preventDefault();
    switchPage('asfalt');
  });

  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navList.classList.toggle('open');
  });

  document.querySelectorAll('[data-scroll]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.scroll;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* --- Before/After Compare with Roller --- */
function initCompareSliders() {
  document.querySelectorAll('.hero__compare').forEach(compare => {
    const slider = compare.querySelector('.hero__slider');
    const replayBtn = compare.closest('.hero')?.querySelector(`[data-replay="${compare.id}"]`);

    function setPosition(val) {
      compare.style.setProperty('--pos', val + '%');
      slider.value = val;
    }

    slider.addEventListener('input', () => {
      compare.classList.add('interacted');
      setPosition(slider.value);
    });

    replayBtn?.addEventListener('click', () => playRollerAnimation(compare));
  });
}

function playRollerAnimation(compare) {
  if (!compare || compare.classList.contains('animating')) return;

  const slider = compare.querySelector('.hero__slider');
  compare.classList.add('animating');
  compare.classList.remove('interacted');

  let pos = 0;
  const duration = 2800;
  const start = performance.now();

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    pos = easeInOutCubic(progress) * 100;
    compare.style.setProperty('--pos', pos + '%');
    slider.value = pos;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      compare.classList.remove('animating');
      compare.classList.add('interacted');
    }
  }

  compare.style.setProperty('--pos', '0%');
  slider.value = 0;
  requestAnimationFrame(frame);
}

/* --- Calculators --- */
const SERVICE_NAMES = {
  asfalt: 'Асфальтирование',
  demontazh: 'Демонтаж асфальта',
  yamki: 'Ямочный ремонт',
  bordyury: 'Установка бордюров',
  plitka: 'Укладка тротуарной плитки',
  kroshka: 'Укладка асфальтной крошки'
};

function formatPrice(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
}

function animatePrice(el) {
  el.classList.add('updating');
  setTimeout(() => el.classList.remove('updating'), 300);
}

function initCalculators() {
  document.querySelectorAll('.calc').forEach(calc => {
    const type = calc.dataset.calc;
    const inputs = calc.querySelectorAll('[data-field]');

    function getVal(field) {
      const el = calc.querySelector(`[data-field="${field}"]`);
      if (!el) return null;
      if (el.type === 'checkbox') return el.checked;
      return el.value;
    }

    function update() {
      const result = calculate(type, calc);
      Object.entries(result).forEach(([key, val]) => {
        const out = calc.querySelector(`[data-out="${key}"]`);
        if (out) {
          out.textContent = formatPrice(val);
          animatePrice(out);
        }
      });
      calc._lastResult = result;
      calc._lastParams = getCalcParams(calc);
    }

    inputs.forEach(input => {
      input.addEventListener('input', update);
      input.addEventListener('change', update);
    });

    update();
  });

  document.querySelectorAll('[data-open-form]').forEach(btn => {
    btn.addEventListener('click', () => {
      const service = btn.dataset.openForm;
      openFormWithCalc(service);
    });
  });
}

function getCalcParams(calc) {
  const params = {};
  calc.querySelectorAll('[data-field]').forEach(el => {
    const key = el.dataset.field;
    if (el.type === 'checkbox') {
      params[key] = el.checked;
    } else {
      const label = el.closest('.calc__field')?.querySelector('label')?.textContent || key;
      const displayVal = el.tagName === 'SELECT'
        ? el.options[el.selectedIndex].text
        : el.value;
      params[label] = displayVal;
    }
  });
  return params;
}

function calculate(type, calc) {
  const g = f => getField(calc, f);

  switch (type) {
    case 'asfalt': {
      const area = +g('area') || 0;
      const thickness = +g('thickness') || 5;
      const asphaltMul = { hot: 1, coarse: 0.9, fine: 1.1 }[g('asphaltType')] || 1;
      const baseMul = { none: 0, light: 350, full: 800 }[g('base')] || 0;
      const objectMul = { parking: 1, road: 1.1, yard: 0.95, industrial: 1.15 }[g('objectType')] || 1;

      let materials = area * thickness * 85 * asphaltMul;
      let labor = area * (420 + thickness * 35) * objectMul;

      if (g('drainage')) labor += area * 120;
      if (g('marking')) labor += area * 45;
      if (g('curbs')) labor += Math.sqrt(area) * 4 * 850;

      labor += area * baseMul;
      return { materials, labor, total: materials + labor };
    }

    case 'demontazh': {
      const area = +g('area') || 0;
      const thickness = +g('thickness') || 8;
      const removalMul = { yes: 1.4, no: 1, recycle: 1.15 }[g('removal')] || 1;
      const total = area * thickness * 95 * removalMul;
      return { total };
    }

    case 'yamki': {
      const area = +g('area') || 0;
      const depth = +g('depth') || 5;
      const typeMul = { hot: 1.3, cold: 1, injection: 1.6 }[g('repairType')] || 1;
      const total = area * depth * 180 * typeMul;
      return { total };
    }

    case 'bordyury': {
      const length = +g('length') || 0;
      const pricePM = { garden: 1200, road: 1850, granite: 4500 }[g('curbType')] || 1850;
      let total = length * pricePM;
      if (g('demolition')) total += length * 350;
      if (g('base')) total += length * 280;
      return { total };
    }

    case 'plitka': {
      const area = +g('area') || 0;
      const tileMul = { vibro: 1, brus: 1.25, granite: 2.8 }[g('tileType')] || 1;
      const baseMul = g('base') === 'concrete' ? 1.3 : 1;
      const materials = area * 1450 * tileMul;
      const labor = area * 680 * baseMul;
      return { materials, labor, total: materials + labor };
    }

    case 'kroshka': {
      const area = +g('area') || 0;
      const thickness = +g('thickness') || 8;
      const chipMul = { standard: 1, fine: 1.1, coated: 1.35 }[g('chipType')] || 1;
      const total = area * thickness * 62 * chipMul;
      return { total };
    }

    default:
      return { total: 0 };
  }
}

function getField(calc, field) {
  const el = calc.querySelector(`[data-field="${field}"]`);
  if (!el) return '';
  if (el.type === 'checkbox') return el.checked;
  return el.value;
}

function openFormWithCalc(service) {
  const calc = document.querySelector(`[data-calc="${service}"]`);
  const form = document.getElementById('contactForm');
  const summary = document.getElementById('calcSummary');

  document.getElementById('formService').value = service;

  if (calc && calc._lastParams) {
    const params = calc._lastParams;
    const total = calc._lastResult?.total;
    let html = `<strong>${SERVICE_NAMES[service]}</strong><br>`;
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === 'boolean') {
        if (v) html += `${k}: да<br>`;
      } else {
        html += `${k}: ${v}<br>`;
      }
    });
    if (total) html += `<strong>Ориентировочно: ${formatPrice(total)}</strong>`;
    summary.innerHTML = html;
    summary.hidden = false;
    document.getElementById('formCalcData').value = JSON.stringify({ service, params, total });
  }

  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

/* --- Projects Filter --- */
function initProjectsFilter() {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !show);
        if (show) {
          card.style.animation = 'none';
          card.offsetHeight;
          card.style.animation = '';
        }
      });
    });
  });
}

/* --- Contact Form --- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const modal = document.getElementById('successModal');

  form?.addEventListener('submit', e => {
    e.preventDefault();
    modal.hidden = false;
    form.reset();
    document.getElementById('calcSummary').hidden = true;
  });

  modal?.querySelector('.modal__close')?.addEventListener('click', () => {
    modal.hidden = true;
  });

  modal?.querySelector('.modal__backdrop')?.addEventListener('click', () => {
    modal.hidden = true;
  });

  const phoneInput = document.getElementById('phone');
  phoneInput?.addEventListener('input', e => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('8')) val = '7' + val.slice(1);
    if (!val.startsWith('7') && val.length) val = '7' + val;

    let formatted = '+7';
    if (val.length > 1) formatted += ' (' + val.slice(1, 4);
    if (val.length > 4) formatted += ') ' + val.slice(4, 7);
    if (val.length > 7) formatted += '-' + val.slice(7, 9);
    if (val.length > 9) formatted += '-' + val.slice(9, 11);
    e.target.value = formatted;
  });
}

/* --- Scroll Effects --- */
function initScrollEffects() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });
}

/* --- Reveal on Scroll --- */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
