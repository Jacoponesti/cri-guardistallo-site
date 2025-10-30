// ===== NAVBAR: evidenzia SOLO la voce della pagina corrente (robusto) =====
document.addEventListener('DOMContentLoaded', () => {
    // nome file attuale (senza query/hash), in minuscolo
    const hereRaw = location.pathname.split('/').pop() || 'index.html';
    const here = hereRaw.split('?')[0].split('#')[0].toLowerCase();

    const links = document.querySelectorAll('.navbar a.nav-link');
    links.forEach(a => a.classList.remove('active')); // azzera sempre

    // normalizza "home"
    const isHome = (here === '' || here === 'index' || here === 'index.html');

    let matched = false;

    // primo passaggio: match diretto
    links.forEach(a => {
        let href = (a.getAttribute('href') || '').toLowerCase();
        href = href.split('?')[0].split('#')[0];         // togli query/hash
        if (href === '' || href === './') href = 'index.html';

        if (isHome && href === 'index.html') {
            a.classList.add('active'); matched = true;
        } else if (!isHome && href === here) {
            a.classList.add('active'); matched = true;
        }
    });

    // fallback: confronta anche senza estensione (.html)
    if (!matched) {
        const hereNoExt = here.endsWith('.html') ? here.slice(0, -5) : here;
        links.forEach(a => {
            let href = (a.getAttribute('href') || '').toLowerCase();
            href = href.replace(/^\.\//, '').replace(/#.*$/, '').replace(/\?.*$/, '');
            if (href.endsWith('.html')) href = href.slice(0, -5);
            if (href === hereNoExt) {
                a.classList.add('active'); matched = true;
            }
        });
    }

    // nessun else: se non trova niente, lascia tutto senza active (ok)
});

// ===== PRENOTA UN SERVIZIO: UX + VALIDAZIONE + EMAIL PULITA =====
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('requestForm');
    if (!form) return; // esci se non siamo nella pagina del form

    // --- Redirect Web3Forms + messaggio OK ---
    const ok = document.getElementById('formStatus');
    const err = document.getElementById('formError');
    const redirectField = document.getElementById('redirectUrl');

    if (redirectField) {
        const u = new URL(window.location.href);
        u.searchParams.set('ok', '1');
        redirectField.value = u.toString();
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('ok') === '1' && ok) {
        ok.classList.remove('d-none');
        err && err.classList.add('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Riferimenti UI / campi dinamici ---
    const selectServizio = document.getElementById('servizioSelect');

    const orarioField = document.getElementById('orarioField');
    const orarioInput = document.getElementById('orarioInput');
    const oraRitornoField = document.getElementById('oraRitornoField');

    const luogoField = document.getElementById('luogoField');
    const luogoInput = document.getElementById('luogoAutocomplete');
    const luogoComune = document.getElementById('luogoComune');
    const luogoLink = document.getElementById('luogoLinkNice');

    const partenzaField = document.getElementById('partenzaField');
    const partenzaInput = document.getElementById('partenzaAutocomplete');
    const partenzaComune = document.getElementById('partenzaComune');
    const partenzaLink = document.getElementById('partenzaLinkNice');

    const nonDeambulaChk = document.getElementById('nonDeambulaChk');
    const pesoField = document.getElementById('pesoField');
    const pesoInput = document.getElementById('pesoInput');

    const sintomiSi = document.getElementById('sintomiSi');
    const sintomiNo = document.getElementById('sintomiNo');
    const sintomiDettaglioField = document.getElementById('sintomiDettaglioField');
    const sintomiDettaglio = document.getElementById('sintomiDettaglio');

    // --- Stepper UI (Dati → Logistica → Invio) ---
    function updateStepper() {
        const steps = document.querySelectorAll('.stepper .step');
        if (!steps.length) return;
        steps.forEach(s => s.classList.remove('active'));
        // Dati
        steps[0]?.classList.add('active');
        // Logistica se Trasporto sanitario
        if (selectServizio?.value === 'Trasporto sanitario') {
            steps[2]?.classList.add('active');
        }
    }

    // --- Toggle campi in base al tipo di servizio ---
    function toggleExtraFields() {
        const isTrasporto = selectServizio?.value === 'Trasporto sanitario';

        // Mostra/nascondi gruppi
        [orarioField, oraRitornoField, luogoField, partenzaField].forEach(el => {
            if (!el) return;
            isTrasporto ? el.classList.remove('d-none') : el.classList.add('d-none');
        });

        // Requisiti
        if (isTrasporto) {
            orarioInput?.setAttribute('required', 'required');
            luogoInput?.setAttribute('required', 'required');
            partenzaInput?.setAttribute('required', 'required');
        } else {
            orarioInput?.removeAttribute('required'); if (orarioInput) orarioInput.value = '';
            luogoInput?.removeAttribute('required'); if (luogoInput) luogoInput.value = '';
            partenzaInput?.removeAttribute('required'); if (partenzaInput) partenzaInput.value = '';

            // pulizia opzionale
            if (pesoField) pesoField.classList.add('d-none');
            if (pesoInput) pesoInput.value = '';
            if (sintomiDettaglioField) { sintomiDettaglioField.classList.add('d-none'); }
            if (sintomiDettaglio) { sintomiDettaglio.removeAttribute('required'); sintomiDettaglio.value = ''; }
            [sintomiSi, sintomiNo].forEach(r => r && (r.checked = false));
        }

        updateStepper();
    }
    selectServizio?.addEventListener('change', toggleExtraFields);
    toggleExtraFields();

    // --- Non deambula → mostra/nasconde Peso ---
    nonDeambulaChk?.addEventListener('change', () => {
        if (!pesoField) return;
        if (nonDeambulaChk.checked) {
            pesoField.classList.remove('d-none');
        } else {
            pesoField.classList.add('d-none');
            if (pesoInput) pesoInput.value = '';
        }
    });

    // --- Sintomi → dettaglio obbligatorio se "Sì" ---
    function toggleSintomiDettaglio() {
        if (!sintomiDettaglioField || !sintomiDettaglio) return;
        if (sintomiSi?.checked) {
            sintomiDettaglioField.classList.remove('d-none');
            sintomiDettaglio.setAttribute('required', 'required');
        } else {
            sintomiDettaglioField.classList.add('d-none');
            sintomiDettaglio.removeAttribute('required');
            sintomiDettaglio.value = '';
        }
    }
    [sintomiSi, sintomiNo].forEach(r => r?.addEventListener('change', toggleSintomiDettaglio));
    toggleSintomiDettaglio();

    // --- Submit: validazione, spinner, normalizzazione email, blocchi DEST/ PART ---
    form.addEventListener('submit', (e) => {
        form.classList.add('was-validated');

        // Se Trasporto, richiedi i campi logistici
        const isTrasporto = selectServizio?.value === 'Trasporto sanitario';
        if (isTrasporto) {
            orarioInput?.setAttribute('required', 'required');
            luogoInput?.setAttribute('required', 'required');
            partenzaInput?.setAttribute('required', 'required');
        }

        // Normalizza "Non deambula" → se non spuntata invia "No"
        const existingHidden = document.getElementById('nonDeambulaHidden');
        if (existingHidden) existingHidden.remove();
        if (!nonDeambulaChk?.checked) {
            const h = document.createElement('input');
            h.type = 'hidden';
            h.id = 'nonDeambulaHidden';
            h.name = 'non_deambula';
            h.value = 'No';
            form.appendChild(h);
        }

        // Crea i blocchi testuali DEST/ PART subito dopo "Servizio"
        // (ordine corretto in email Web3Forms)
        const afterNode = selectServizio;
        const insertAfter = (ref, node) => ref.parentNode.insertBefore(node, ref.nextSibling);

        // rimuovi vecchie versioni se presenti
        form.querySelectorAll('input[name="DESTINAZIONE"], input[name="PARTENZA"]').forEach(el => el.remove());

        const destTxt = `📍 DESTINAZIONE
${luogoInput?.value || ''}
${luogoComune?.value || ''}
Mappa: ${luogoLink?.value || ''}`;

        const partTxt = `📍 PARTENZA
${partenzaInput?.value || ''}
${partenzaComune?.value || ''}
Mappa: ${partenzaLink?.value || ''}`;

        const destField = document.createElement('input');
        destField.type = 'hidden';
        destField.name = 'DESTINAZIONE';
        destField.value = destTxt;

        const partField = document.createElement('input');
        partField.type = 'hidden';
        partField.name = 'PARTENZA';
        partField.value = partTxt;

        if (afterNode) {
            insertAfter(afterNode, destField);
            insertAfter(destField, partField);
        } else {
            // fallback: in fondo
            form.appendChild(destField);
            form.appendChild(partField);
        }

        // Validazione finale HTML5
        if (!form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Stepper → attiva anche "Invio"
        const steps = document.querySelectorAll('.stepper .step');
        steps[0]?.classList.add('active');
        steps[2]?.classList.add('active');
        steps[4]?.classList.add('active');

        // Spinner su bottone invio
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.classList.add('btn-loading');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border" role="status" aria-hidden="true"></span> Invio…';
        }
        // Lasciamo che il browser invii a Web3Forms e faccia redirect a ?ok=1
    });
});
