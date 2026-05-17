// API configuration (change to Hugging Face URL in production)
const API_BASE_URL = 'http://localhost:8000/api';
// Example for prod: const API_BASE_URL = 'https://your-name-your-space.hf.space/api';

document.addEventListener('DOMContentLoaded', () => {
    const btnProcess = document.getElementById('btnProcess');
    const userText = document.getElementById('userText');
    const modelSelection = document.getElementById('modelSelection');

    // API Key elements
    const radioKeys = document.getElementsByName('api_key_type');
    const customApiKeyContainer = document.getElementById('customApiKeyContainer');
    const customApiKeyInput = document.getElementById('customApiKey');
    const togglePassword = document.getElementById('togglePassword');

    const progressSection = document.getElementById('progressSection');
    const resultsSection = document.getElementById('resultsSection');

    // Toggle display of the custom API key field
    radioKeys.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customApiKeyContainer.classList.remove('hidden');
            } else {
                customApiKeyContainer.classList.add('hidden');
            }
        });
    });

    // Toggle password visibility
    if (togglePassword && customApiKeyInput) {
        togglePassword.addEventListener('click', () => {
            const type = customApiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
            customApiKeyInput.setAttribute('type', type);
            togglePassword.classList.toggle('ph-eye-closed');
            togglePassword.classList.toggle('ph-eye');
        });
    }

    // Load saved key from LocalStorage
    const savedApiKey = localStorage.getItem('bibliofetch_api_key');
    if (savedApiKey && customApiKeyInput && customApiKeyContainer) {
        customApiKeyInput.value = savedApiKey;
        const customRadio = Array.from(radioKeys).find(r => r.value === 'custom');
        if (customRadio) {
            customRadio.checked = true;
            customApiKeyContainer.classList.remove('hidden');
        }
    }

    // Save key locally as the user types
    if (customApiKeyInput) {
        customApiKeyInput.addEventListener('input', (e) => {
            localStorage.setItem('bibliofetch_api_key', e.target.value.trim());
        });
    }

    btnProcess.addEventListener('click', async () => {
        const text = userText.value.trim();
        if (!text) {
            alert('Please paste your references into the text field.');
            return;
        }

        // Validate the 200-line limit
        const lineCount = text.split('\n').length;
        if (lineCount > 200) {
            alert(`Your text has ${lineCount} lines. The maximum allowed is 200 lines.\n\nTip: paste only the references section of your document.`);
            return;
        }

        // Determine which API key to send
        let apiKeyToSend = null;
        const selectedRadio = Array.from(radioKeys).find(r => r.checked);
        if (selectedRadio && selectedRadio.value === 'custom') {
            const userKey = customApiKeyInput.value.trim();
            if (!userKey) {
                alert('Please enter your Gemini API key or select "Use server key".');
                return;
            }
            apiKeyToSend = userKey;
        }

        // Reset interface
        resetUI();
        btnProcess.disabled = true;
        btnProcess.innerHTML = `<i class="ph ph-spinner"></i> Processing...`;
        progressSection.classList.remove('hidden');

        let extractInterval;
        let enrichInterval;
        let validateInterval;

        try {
            // STEP 1: EXTRACTION (Gemini)
            updateProgressState('step-extract', 'active');

            const barExtract = document.getElementById('bar-extract');
            let extractProgress = 0;
            extractInterval = setInterval(() => {
                if (extractProgress < 95) {
                    if (extractProgress < 50) {
                        extractProgress += 1.0;
                    } else if (extractProgress < 75) {
                        extractProgress += 0.4;
                    } else if (extractProgress < 90) {
                        extractProgress += 0.12;
                    } else {
                        extractProgress += 0.02;
                    }
                    barExtract.style.width = `${Math.min(extractProgress, 95).toFixed(1)}%`;
                }
            }, 200);

            const resExtract = await fetch(`${API_BASE_URL}/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    model: modelSelection ? modelSelection.value : null,
                    api_key: apiKeyToSend
                })
            });
            if (!resExtract.ok) throw new Error(`Extraction error: ${await resExtract.text()}`);
            const dataExtract = await resExtract.json();
            const references = dataExtract.references || [];

            clearInterval(extractInterval);
            barExtract.style.width = '100%';
            updateProgressState('step-extract', 'completed');

            // STEP 2: ENRICHMENT (OpenAlex - item by item for real progress bar)
            updateProgressState('step-enrich', 'active');
            const barEnrich = document.getElementById('bar-enrich');
            const enrichedReferences = [];
            const totalRefs = references.length;

            if (totalRefs === 0) {
                barEnrich.style.width = '100%';
                updateProgressState('step-enrich', 'completed');
            } else {
                let enrichProgress = 0;
                enrichInterval = setInterval(() => {
                    const targetPct = Math.round((enrichedReferences.length / totalRefs) * 100);
                    const nextTargetPct = Math.round(((enrichedReferences.length + 1) / totalRefs) * 100);
                    const limit = targetPct + (nextTargetPct - targetPct) * 0.9;
                    if (enrichProgress < limit) {
                        enrichProgress += 0.8;
                        barEnrich.style.width = `${Math.min(enrichProgress, limit).toFixed(1)}%`;
                    }
                }, 50);

                for (let i = 0; i < totalRefs; i++) {
                    const resEnrich = await fetch(`${API_BASE_URL}/enrich`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ references: [references[i]] })
                    });
                    if (!resEnrich.ok) {
                        clearInterval(enrichInterval);
                        throw new Error(`Enrichment error on item ${i + 1}`);
                    }
                    const dataEnrich = await resEnrich.json();
                    if (dataEnrich.references && dataEnrich.references.length > 0) {
                        enrichedReferences.push(dataEnrich.references[0]);
                    }

                    enrichProgress = Math.round(((i + 1) / totalRefs) * 100);
                    barEnrich.style.width = `${enrichProgress}%`;
                }
                clearInterval(enrichInterval);
                barEnrich.style.width = '100%';
                updateProgressState('step-enrich', 'completed');
            }

            // STEP 3: VALIDATION (PDF link testing - item by item for real progress bar)
            updateProgressState('step-validate', 'active');
            const barValidate = document.getElementById('bar-validate');
            const finalReport = {
                success: [],
                paywall_blocked: [],
                no_doi: []
            };
            const totalEnriched = enrichedReferences.length;

            if (totalEnriched === 0) {
                barValidate.style.width = '100%';
                updateProgressState('step-validate', 'completed');
            } else {
                let validateProgress = 0;
                let validatedCount = 0;
                validateInterval = setInterval(() => {
                    const targetPct = Math.round((validatedCount / totalEnriched) * 100);
                    const nextTargetPct = Math.round(((validatedCount + 1) / totalEnriched) * 100);
                    const limit = targetPct + (nextTargetPct - targetPct) * 0.9;
                    if (validateProgress < limit) {
                        validateProgress += 0.8;
                        barValidate.style.width = `${Math.min(validateProgress, limit).toFixed(1)}%`;
                    }
                }, 50);

                for (let i = 0; i < totalEnriched; i++) {
                    const resValidate = await fetch(`${API_BASE_URL}/validate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ references: [enrichedReferences[i]] })
                    });
                    if (!resValidate.ok) {
                        clearInterval(validateInterval);
                        throw new Error(`Validation error on item ${i + 1}`);
                    }
                    const dataValidate = await resValidate.json();

                    if (dataValidate.success) finalReport.success.push(...dataValidate.success);
                    if (dataValidate.paywall_blocked) finalReport.paywall_blocked.push(...dataValidate.paywall_blocked);
                    if (dataValidate.no_doi) finalReport.no_doi.push(...dataValidate.no_doi);

                    validatedCount++;
                    validateProgress = Math.round((validatedCount / totalEnriched) * 100);
                    barValidate.style.width = `${validateProgress}%`;
                }
                clearInterval(validateInterval);
                barValidate.style.width = '100%';
                updateProgressState('step-validate', 'completed');
            }

            // RENDER FINAL RESULTS
            renderResults(finalReport);

        } catch (error) {
            if (extractInterval) clearInterval(extractInterval);
            if (enrichInterval) clearInterval(enrichInterval);
            if (validateInterval) clearInterval(validateInterval);
            console.error(error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            // Restore button
            btnProcess.disabled = false;
            btnProcess.innerHTML = `<span>Process References</span> <i class="ph ph-arrow-right"></i>`;
        }
    });

    function updateProgressState(stepId, state) {
        const step = document.getElementById(stepId);
        const iconContainer = step.querySelector('.status-icon');

        if (state === 'active') {
            step.classList.add('active');
            step.classList.remove('completed');
            iconContainer.innerHTML = '<i class="ph ph-spinner"></i>';
        } else if (state === 'completed') {
            step.classList.remove('active');
            step.classList.add('completed');
            iconContainer.innerHTML = '<i class="ph ph-check-circle"></i>';
        } else {
            step.classList.remove('active', 'completed');
            iconContainer.innerHTML = '<i class="ph ph-circle"></i>';
        }
    }

    function resetUI() {
        resultsSection.classList.add('hidden');
        ['step-extract', 'step-enrich', 'step-validate'].forEach(id => updateProgressState(id, 'pending'));

        document.getElementById('bar-extract').style.width = '0%';
        document.getElementById('bar-enrich').style.width = '0%';
        document.getElementById('bar-validate').style.width = '0%';

        document.getElementById('listSuccess').innerHTML = '';
        document.getElementById('listPaywall').innerHTML = '';
        document.getElementById('listNoDoi').innerHTML = '';

        document.getElementById('countSuccess').textContent = '0';
        document.getElementById('countPaywall').textContent = '0';
        document.getElementById('countNoDoi').textContent = '0';
    }

    function renderResults(data) {
        resultsSection.classList.remove('hidden');

        // Render Success
        const successList = document.getElementById('listSuccess');
        document.getElementById('countSuccess').textContent = data.success.length;

        data.success.forEach(item => {
            successList.innerHTML += `
                <div class="list-item">
                    <div class="list-item-title">${item.title}</div>
                    <div class="list-item-meta">DOI: ${item.doi}</div>
                    <a href="${item.pdf_url}" target="_blank" class="action-link">
                        <i class="ph ph-download-simple"></i> Open PDF
                    </a>
                </div>
            `;
        });
        if (data.success.length === 0) successList.innerHTML = '<div class="list-item">No accessible PDFs found.</div>';

        // Render Paywall
        const paywallList = document.getElementById('listPaywall');
        document.getElementById('countPaywall').textContent = data.paywall_blocked.length;

        data.paywall_blocked.forEach(item => {
            paywallList.innerHTML += `
                <div class="list-item">
                    <div class="list-item-title">${item.title}</div>
                    ${item.doi ? `<a href="${item.doi}" target="_blank" class="action-link" style="margin-top: 8px;"><i class="ph ph-arrow-square-out"></i> Try manually</a>` : ''}
                </div>
            `;
        });
        if (data.paywall_blocked.length === 0) paywallList.innerHTML = '<div class="list-item">No blocks recorded.</div>';

        // Render No DOI
        const noDoiList = document.getElementById('listNoDoi');
        document.getElementById('countNoDoi').textContent = data.no_doi.length;

        data.no_doi.forEach(item => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item.title)}`;
            noDoiList.innerHTML += `
                <div class="list-item">
                    <div class="list-item-title">${item.title}</div>
                    <div class="list-item-meta">Journal: ${item.journal || 'Not provided'}</div>
                    <a href="${searchUrl}" target="_blank" class="action-link" style="margin-top: 8px;">
                        <i class="ph ph-google-logo"></i> Search on Google
                    </a>
                </div>
            `;
        });
        if (data.no_doi.length === 0) noDoiList.innerHTML = '<div class="list-item">All references had a DOI.</div>';
    }

    // Intercept link clicks to keep focus on the current tab
    const handleLinkClick = (e) => {
        const link = e.target.closest('a.action-link');
        if (link) {
            const item = link.closest('.list-item');
            if (item) item.classList.add('clicked');

            // Standard left-click: controlled open to retain focus.
            // Ctrl+click / Cmd+click / middle-click: let the browser open natively in background.
            if (e.type === 'click' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                const url = link.href;
                const newWin = window.open(url, '_blank');
                if (newWin) {
                    window.focus();
                    setTimeout(() => window.focus(), 10);
                }
            }
        }
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('auxclick', handleLinkClick);
});
