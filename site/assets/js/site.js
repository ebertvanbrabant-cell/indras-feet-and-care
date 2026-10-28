/* Indra's feet & care · gedeelde scripts. Licht gehouden: snelheid gaat voor animatie. */
(function () {
  var stil = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll-reveal, gestaffeld per groep (data-stagger op de ouder)
  document.querySelectorAll('[data-stagger]').forEach(function (groep) {
    groep.querySelectorAll('.reveal').forEach(function (el, i) { el.style.setProperty('--i', i); });
  });
  var reveals = document.querySelectorAll('.reveal');
  if (stil || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (it.isIntersecting) { it.target.classList.add('in'); io.unobserve(it.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    // vangnet: na 3 s alles tonen, ook als de observer niet afgaat
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add('in'); }); }, 3000);
  }

  // Lichte parallax op de roze schijf achter de herofoto
  var schijf = document.querySelector('.beeld .schijf');
  if (schijf && !stil) {
    var bezig = false;
    window.addEventListener('scroll', function () {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        schijf.style.transform = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0)';
        bezig = false;
      });
    }, { passive: true });
  }

  // Voor/na-slider (sleepbaar en met de pijltjestoetsen via de range-input)
  document.querySelectorAll('.slider').forEach(function (s) {
    var r = s.querySelector('input[type=range]');
    if (!r) return;
    var zet = function () { s.style.setProperty('--pos', r.value + '%'); };
    r.addEventListener('input', zet);
    zet();
  });

  // Sticky boekknop verbergen zodra het boekblok in beeld is
  var sticky = document.querySelector('.sticky');
  var boeken = document.getElementById('boeken');
  if (sticky && boeken && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (items) {
      sticky.classList.toggle('weg', items[0].isIntersecting);
    }, { threshold: 0.2 }).observe(boeken);
  }

  // Cookiemelding: keuze bewaren in de browser. Nu laadt de site geen enkele tracking, welke keuze ook.
  var cookies = document.querySelector('.cookies');
  var leesKeuze = function () { try { return localStorage.getItem('cookiekeuze'); } catch (e) { return 'onbekend'; } };
  if (cookies) {
    if (!leesKeuze()) cookies.hidden = false;
    cookies.querySelectorAll('[data-cookies]').forEach(function (b) {
      b.addEventListener('click', function () {
        try { localStorage.setItem('cookiekeuze', b.getAttribute('data-cookies')); } catch (e) {}
        cookies.hidden = true;
      });
    });
    document.querySelectorAll('[data-cookies-open]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); cookies.hidden = false; });
    });
  }

  // Afsprakenplanner op /boeken/. Tijdelijk: de aanvraag gaat via WhatsApp naar Indra,
  // tot de agenda van ons platform hier in de plaats komt.
  var planner = document.getElementById('planner');
  if (planner) {
    var dag = planner.querySelector('#b-dag');
    var morgen = new Date(); morgen.setDate(morgen.getDate() + 1);
    dag.min = morgen.toISOString().slice(0, 10);
    var kleurVeld = document.getElementById('kleur-veld');
    planner.querySelectorAll('input[name=soort]').forEach(function (r) {
      r.addEventListener('change', function () { kleurVeld.hidden = planner.soort.value !== 'Met gellak'; });
    });
    var fout = document.getElementById('planner-fout');
    planner.addEventListener('submit', function (e) {
      e.preventDefault();
      var eersteFout = null;
      planner.querySelectorAll('[required]').forEach(function (v) {
        var ok = v.type === 'checkbox' ? v.checked : v.value.trim() !== '';
        if (v.name === 'postcode') ok = /^\d{4}$/.test(v.value.trim());
        if (v.type !== 'radio') v.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !eersteFout) eersteFout = v;
      });
      if (eersteFout) {
        fout.textContent = eersteFout.name === 'akkoord' ? 'Vink aan dat je akkoord gaat met de voorwaarden.' : 'Vul de rood gemarkeerde velden in.';
        eersteFout.focus();
        return;
      }
      fout.textContent = '';
      var f = planner.elements;
      var d = new Date(f.dag.value + 'T12:00:00');
      var dagTekst = d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });
      var tekst = [
        'Hallo Indra, ik wil graag een afspraak aanvragen.',
        '',
        'Wat: ' + f.soort.value + (f.soort.value === 'Met gellak' && f.kleur.value.trim() ? ' (kleur: ' + f.kleur.value.trim() + ')' : ''),
        'Voetmassage: ' + (f.massage.checked ? 'ja' : 'nee'),
        'Dag: ' + dagTekst + ', ' + f.moment.value.toLowerCase(),
        f.anders.value.trim() ? 'Voorkeur: ' + f.anders.value.trim() : '',
        'Adres: ' + f.straat.value.trim() + ', ' + f.postcode.value.trim() + ' ' + f.gemeente.value.trim(),
        'Naam: ' + f.naam.value.trim(),
        'Gsm: ' + f.gsm.value.trim(),
        f.email.value.trim() ? 'E-mail: ' + f.email.value.trim() : '',
        f.notitie.value.trim() ? 'Opmerking: ' + f.notitie.value.trim() : ''
      ].filter(function (r, i) { return r !== '' || i === 1; }).join('\n');
      var url = 'https://wa.me/32485179324?text=' + encodeURIComponent(tekst);
      document.getElementById('planner-wa').href = url;
      document.getElementById('planner-klaar').hidden = false;
      window.open(url, '_blank', 'noopener');
    });
  }

  // Formulieren: tot ze aan ons platform gekoppeld zijn, openen ze een mail naar Indra.
  document.querySelectorAll('form[data-nog-koppelen]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var regels = [];
      f.querySelectorAll('input,textarea').forEach(function (v) {
        if (!v.value.trim()) return;
        var l = f.querySelector('label[for="' + v.id + '"]');
        regels.push((l ? l.textContent : v.name) + ': ' + v.value.trim());
      });
      var onderwerp = f.getAttribute('data-onderwerp') || 'Bericht via de website';
      window.location.href = 'mailto:vanbraeckelindra@gmail.com?subject=' + encodeURIComponent(onderwerp) + '&body=' + encodeURIComponent(regels.join('\n'));
      var m = f.querySelector('.melding');
      if (m) m.textContent = 'Je mailprogramma opent. Verstuur de mail, dan is het in orde.';
    });
  });
})();
