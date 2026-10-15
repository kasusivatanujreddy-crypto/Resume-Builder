// CraftCV Studio - Application Logic & State Engine

(function () {
  'use strict';

  // Application State
  const STORAGE_KEY = 'craftcv_resume_state_v1';
  let resumeState = null;
  let activeBulletTarget = null;
  let currentZoom = 0.85;

  // Suggested popular skills by category
  const QUICK_SKILL_SUGGESTIONS = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Docker',
    'Kubernetes', 'AWS', 'GraphQL', 'PostgreSQL', 'Redis', 'CI/CD',
    'System Design', 'Figma', 'Agile', 'Next.js', 'Tailwind CSS'
  ];

  // Initialize
  function init() {
    loadState();
    initSupabaseClient();
    setupEventListeners();
    populateForm();
    setupDesignControls();
    setupZoomControls();
    setupActionVerbsModal();
    updateLivePreview();
    autoFitZoom();
    checkSupabaseHealth();
    checkUrlParams();
  }

  // Load state from local storage or default sample
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        resumeState = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not parse localStorage, fallback to default sample', e);
    }

    if (!resumeState) {
      resumeState = JSON.parse(JSON.stringify(SAMPLE_RESUMES.software_engineer));
    }

    // Auto-align default bullets with strong action verbs if legacy draft loaded
    if (resumeState && Array.isArray(resumeState.experience)) {
      resumeState.experience.forEach(exp => {
        if (!Array.isArray(exp.bullets)) return;
        exp.bullets = exp.bullets.map(b => {
          if (b.startsWith('Mentored a cohort')) {
            return 'Accelerated engineering velocity by mentoring a cohort of 14 software engineers across 3 geographic zones, conducting over 120 architecture design reviews.';
          }
          if (b.startsWith('Optimized bundle size')) {
            return 'Accelerated page load performance by optimizing bundle size and Core Web Vitals, slashing initial Largest Contentful Paint (LCP) from 3.4s to 0.9s.';
          }
          if (b.startsWith('Collaborated closely')) {
            return 'Spearheaded cross-functional design system initiative with product designers, establishing unified atomic tokens across web and mobile platforms.';
          }
          if (b.startsWith('Developed distributed')) {
            return 'Architected distributed telemetry dashboards monitoring 40,000+ edge nodes using Go and ClickHouse.';
          }
          if (b.startsWith('Automated CI/CD')) {
            return 'Accelerated deployment lead time from 4 hours to 9 minutes by automating CI/CD release workflows with GitHub Actions and Terraform.';
          }
          return b;
        });
      });
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeState));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  // Toast Notification Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${type === 'success' ? '✓' : '✦'}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Populate Personal Details Form
  function populateForm() {
    const p = resumeState.personal || {};
    setVal('field-full-name', p.fullName || '');
    setVal('field-job-title', p.title || '');
    setVal('field-email', p.email || '');
    setVal('field-phone', p.phone || '');
    setVal('field-location', p.location || '');
    setVal('field-website', p.website || '');
    setVal('field-linkedin', p.linkedin || '');
    setVal('field-github', p.github || '');
    setVal('field-summary', p.summary || '');

    const avatarImg = document.getElementById('avatar-preview-img');
    if (avatarImg && p.avatar) {
      avatarImg.src = p.avatar;
    }
    const showAvatarBox = document.getElementById('field-show-avatar');
    if (showAvatarBox) {
      showAvatarBox.checked = p.showAvatar !== false;
    }

    renderExperienceList();
    renderEducationList();
    renderSkillsList();
    renderProjectsList();
    renderCertsList();
    renderLanguagesList();
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Nav Tabs in Editor
    const tabs = document.querySelectorAll('.editor-nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));
        const targetSec = document.getElementById(targetId);
        if (targetSec) targetSec.classList.add('active');
      });
    });

    // View Switchers (Split / Editor / Preview)
    const btnSplit = document.getElementById('btn-view-split');
    const btnEditor = document.getElementById('btn-view-editor');
    const btnPreview = document.getElementById('btn-view-preview');
    const container = document.getElementById('app-container');

    function setActiveView(btn, modeClass) {
      [btnSplit, btnEditor, btnPreview].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.classList.remove('mode-editor-only', 'mode-preview-only');
      if (modeClass) container.classList.add(modeClass);
      if (btn === btnPreview || btn === btnSplit) {
        setTimeout(autoFitZoom, 50);
      }
    }

    if (btnSplit) btnSplit.addEventListener('click', () => setActiveView(btnSplit, ''));
    if (btnEditor) btnEditor.addEventListener('click', () => setActiveView(btnEditor, 'mode-editor-only'));
    if (btnPreview) btnPreview.addEventListener('click', () => setActiveView(btnPreview, 'mode-preview-only'));

    // Personal details input bindings
    bindPersonalInput('field-full-name', 'fullName');
    bindPersonalInput('field-job-title', 'title');
    bindPersonalInput('field-email', 'email');
    bindPersonalInput('field-phone', 'phone');
    bindPersonalInput('field-location', 'location');
    bindPersonalInput('field-website', 'website');
    bindPersonalInput('field-linkedin', 'linkedin');
    bindPersonalInput('field-github', 'github');
    bindPersonalInput('field-summary', 'summary');

    // Avatar show toggle
    const showAvatarBox = document.getElementById('field-show-avatar');
    if (showAvatarBox) {
      showAvatarBox.addEventListener('change', (e) => {
        resumeState.personal.showAvatar = e.target.checked;
        saveState();
        updateLivePreview();
      });
    }

    // Avatar file upload
    const avatarInput = document.getElementById('field-avatar-file');
    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            resumeState.personal.avatar = event.target.result;
            const img = document.getElementById('avatar-preview-img');
            if (img) img.src = event.target.result;
            saveState();
            updateLivePreview();
            showToast('Profile photo updated', 'success');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Remove Avatar button
    const removeAvatarBtn = document.getElementById('btn-remove-avatar');
    if (removeAvatarBtn) {
      removeAvatarBtn.addEventListener('click', () => {
        resumeState.personal.avatar = '';
        const img = document.getElementById('avatar-preview-img');
        if (img) img.src = 'assets/avatar.jpg';
        saveState();
        updateLivePreview();
        showToast('Profile photo removed');
      });
    }

    // Enhance Summary with AI suggestion
    const enhanceSummaryBtn = document.getElementById('btn-suggest-summary');
    if (enhanceSummaryBtn) {
      enhanceSummaryBtn.addEventListener('click', () => {
        generateSummarySuggestion();
      });
    }

    // Add Position
    const addExpBtn = document.getElementById('btn-add-experience');
    if (addExpBtn) {
      addExpBtn.addEventListener('click', () => {
        if (!resumeState.experience) resumeState.experience = [];
        resumeState.experience.unshift({
          id: 'exp-' + Date.now(),
          title: 'Software Engineer',
          company: 'Company Name',
          location: 'City, Country',
          startDate: '2022',
          endDate: '',
          current: true,
          bullets: ['Spearheaded core feature development resulting in measurable business growth.']
        });
        saveState();
        renderExperienceList();
        updateLivePreview();
        showToast('Added new experience entry');
      });
    }

    // Auto-Enhance Bullets with Strong Action Verbs
    const btnEnhanceVerbs = document.getElementById('btn-enhance-action-verbs');
    if (btnEnhanceVerbs) {
      btnEnhanceVerbs.addEventListener('click', () => {
        enhanceAllBulletsWithActionVerbs();
      });
    }

    // Add Degree
    const addEduBtn = document.getElementById('btn-add-education');
    if (addEduBtn) {
      addEduBtn.addEventListener('click', () => {
        if (!resumeState.education) resumeState.education = [];
        resumeState.education.unshift({
          id: 'edu-' + Date.now(),
          degree: 'Bachelor of Science in Computer Science',
          school: 'University Name',
          location: 'City, Country',
          startDate: '2018',
          endDate: '2022',
          gpa: '3.8 / 4.0',
          honors: 'Dean’s Honor List'
        });
        saveState();
        renderEducationList();
        updateLivePreview();
        showToast('Added education entry');
      });
    }

    // Add Skill Category
    const addSkillCatBtn = document.getElementById('btn-add-skill-category');
    if (addSkillCatBtn) {
      addSkillCatBtn.addEventListener('click', () => {
        if (!resumeState.skills) resumeState.skills = [];
        resumeState.skills.push({
          category: 'New Category',
          items: ['Skill 1', 'Skill 2']
        });
        saveState();
        renderSkillsList();
        updateLivePreview();
        showToast('Added skill category');
      });
    }

    // Add Project
    const addProjBtn = document.getElementById('btn-add-project');
    if (addProjBtn) {
      addProjBtn.addEventListener('click', () => {
        if (!resumeState.projects) resumeState.projects = [];
        resumeState.projects.unshift({
          id: 'proj-' + Date.now(),
          name: 'Project Title',
          role: 'Lead Developer',
          link: 'https://github.com/username/project',
          tech: 'React, Node.js',
          description: 'High-impact project solving complex workflow challenges.'
        });
        saveState();
        renderProjectsList();
        updateLivePreview();
        showToast('Added project');
      });
    }

    // Add Cert
    const addCertBtn = document.getElementById('btn-add-cert');
    if (addCertBtn) {
      addCertBtn.addEventListener('click', () => {
        if (!resumeState.certifications) resumeState.certifications = [];
        resumeState.certifications.unshift({
          id: 'cert-' + Date.now(),
          name: 'Certification Name',
          issuer: 'Issuing Organization',
          date: '2023',
          credentialId: ''
        });
        saveState();
        renderCertsList();
        updateLivePreview();
        showToast('Added certification');
      });
    }

    // Add Language
    const addLangBtn = document.getElementById('btn-add-language');
    if (addLangBtn) {
      addLangBtn.addEventListener('click', () => {
        if (!resumeState.languages) resumeState.languages = [];
        resumeState.languages.push({
          name: 'Language',
          level: 'Professional Working'
        });
        saveState();
        renderLanguagesList();
        updateLivePreview();
        showToast('Added language');
      });
    }

    // Zoom Controls
    setupZoomControls();

    // ATS Drawer Toggle
    const atsScorePill = document.getElementById('btn-toggle-ats');
    const atsDrawer = document.getElementById('ats-drawer');
    const closeAtsBtn = document.getElementById('btn-close-ats');

    if (atsScorePill && atsDrawer) {
      atsScorePill.addEventListener('click', () => {
        atsDrawer.classList.toggle('open');
      });
    }
    if (closeAtsBtn && atsDrawer) {
      closeAtsBtn.addEventListener('click', () => {
        atsDrawer.classList.remove('open');
      });
    }

    // Action Verbs Modal
    setupActionVerbsModal();

    // Sample Switcher Dropdown
    const sampleDropdownWrap = document.getElementById('sample-dropdown-wrap');
    const btnSamplesToggle = document.getElementById('btn-samples-toggle');
    if (btnSamplesToggle && sampleDropdownWrap) {
      btnSamplesToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sampleDropdownWrap.classList.toggle('open');
      });
      document.addEventListener('click', () => {
        sampleDropdownWrap.classList.remove('open');
      });

      const sampleItems = sampleDropdownWrap.querySelectorAll('.dropdown-item');
      sampleItems.forEach(item => {
        item.addEventListener('click', () => {
          const sampleKey = item.getAttribute('data-sample');
          if (SAMPLE_RESUMES[sampleKey]) {
            resumeState = JSON.parse(JSON.stringify(SAMPLE_RESUMES[sampleKey]));
            saveState();
            populateForm();
            setupDesignControls();
            updateLivePreview();
            showToast(`Loaded "${sampleKey.replace('_', ' ').toUpperCase()}" sample resume!`, 'success');
          }
          sampleDropdownWrap.classList.remove('open');
        });
      });
    }

    // Export JSON
    const btnExportJson = document.getElementById('btn-export-json');
    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeState, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${(resumeState.personal.fullName || 'resume').toLowerCase().replace(/\s+/g, '_')}_craftcv.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Resume JSON data exported!', 'success');
      });
    }

    // Import JSON
    const fileImportJson = document.getElementById('file-import-json');
    if (fileImportJson) {
      fileImportJson.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const imported = JSON.parse(event.target.result);
              if (imported.personal) {
                resumeState = imported;
                saveState();
                populateForm();
                setupDesignControls();
                updateLivePreview();
                showToast('Resume data loaded successfully!', 'success');
              } else {
                alert('Invalid resume JSON format.');
              }
            } catch (err) {
              alert('Could not parse JSON file.');
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // Reset / Clear
    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all fields? You can load samples back at any time.')) {
          resumeState = {
            personal: { fullName: '', title: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', avatar: '', showAvatar: false, summary: '' },
            experience: [],
            education: [],
            skills: [{ category: 'Skills', items: [] }],
            projects: [],
            certifications: [],
            languages: [],
            settings: { template: 'modern', primaryColor: '#2563eb', secondaryColor: '#1e293b', fontFamily: 'Inter', fontSize: 'normal', lineHeight: 'normal' }
          };
          saveState();
          populateForm();
          setupDesignControls();
          updateLivePreview();
          showToast('Resume fields reset.');
        }
      });
    }

    // Download PDF / Print
    const btnPrintPdf = document.getElementById('btn-print-pdf');
    if (btnPrintPdf) {
      btnPrintPdf.addEventListener('click', () => {
        window.print();
      });
    }

    // Supabase Cloud Actions
    const btnCloudSave = document.getElementById('btn-cloud-save');
    if (btnCloudSave) {
      btnCloudSave.addEventListener('click', () => {
        saveResumeToCloud();
      });
    }

    const btnCloudLoad = document.getElementById('btn-cloud-load');
    if (btnCloudLoad) {
      btnCloudLoad.addEventListener('click', () => {
        openCloudModal();
      });
    }

    const btnCloseCloud = document.getElementById('btn-close-cloud');
    const cloudModal = document.getElementById('cloud-modal');
    if (btnCloseCloud && cloudModal) {
      btnCloseCloud.addEventListener('click', () => {
        cloudModal.classList.remove('open');
      });
      cloudModal.addEventListener('click', (e) => {
        if (e.target === cloudModal) cloudModal.classList.remove('open');
      });
    }

    const btnShareResume = document.getElementById('btn-share-resume');
    if (btnShareResume) {
      btnShareResume.addEventListener('click', () => {
        openShareModal();
      });
    }

    const btnCloseShare = document.getElementById('btn-close-share');
    const shareModal = document.getElementById('share-modal');
    if (btnCloseShare && shareModal) {
      btnCloseShare.addEventListener('click', () => {
        shareModal.classList.remove('open');
      });
      shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) shareModal.classList.remove('open');
      });
    }

    const btnCopyShareLink = document.getElementById('btn-copy-share-link');
    const shareLinkInput = document.getElementById('share-link-input');
    if (btnCopyShareLink && shareLinkInput) {
      btnCopyShareLink.addEventListener('click', () => {
        shareLinkInput.select();
        navigator.clipboard?.writeText(shareLinkInput.value);
        showToast('Share link copied to clipboard! 📋', 'success');
      });
    }

    const supabaseStatusPill = document.getElementById('supabase-status-pill');
    if (supabaseStatusPill) {
      supabaseStatusPill.addEventListener('click', async () => {
        showToast('Verifying Supabase connection...', 'info');
        await checkSupabaseHealth();
      });
    }
  }

  function bindPersonalInput(elementId, stateKey) {
    const el = document.getElementById(elementId);
    if (el) {
      el.addEventListener('input', (e) => {
        if (!resumeState.personal) resumeState.personal = {};
        resumeState.personal[stateKey] = e.target.value;
        saveState();
        updateLivePreview();
      });
    }
  }

  // Generate Smart Summary Suggestion (Live Gemini AI with fallback)
  async function generateSummarySuggestion() {
    const p = resumeState.personal;
    const title = p.title || 'Professional';
    const topSkills = (resumeState.skills && resumeState.skills[0] && resumeState.skills[0].items) 
      ? resumeState.skills[0].items.slice(0, 4).join(', ')
      : 'modern methodologies';

    const btn = document.getElementById('btn-suggest-summary') || document.getElementById('btn-smart-summary');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '✨ Generating with Gemini...';
      btn.disabled = true;
    }

    let generated = null;
    try {
      const prompt = `Write a punchy, ATS-optimized, high-impact 2-3 sentence executive professional resume summary for a "${title}" skilled in: ${topSkills}. Do not use bullet points, intro text, or placeholder brackets. Return only the summary text.`;
      
      const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || '';
      const endpoint = baseUrl + ((window.APP_CONFIG && window.APP_CONFIG.api && window.APP_CONFIG.api.aiSummary) || '/api/ai/summary');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.text) {
          generated = result.text;
          showToast('Generated summary with live Gemini AI! ✨', 'success');
        }
      }
    } catch (err) {
      // Server offline or running via direct file protocol
    } finally {
      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }

    if (!generated) {
      const suggestions = [
        `Results-oriented ${title} with a proven track record delivering scalable solutions and driving business impact. Expert in ${topSkills}, with strong proficiency in cross-functional collaboration and architectural leadership. Dedicated to fostering high engineering standards and accelerating team velocity.`,
        `Accomplished ${title} with proven expertise in engineering robust products and executing strategic initiatives. Demonstrated success optimizing operational workflows, leveraging ${topSkills}, and boosting key performance metrics by over 25%.`,
        `Dynamic and forward-thinking ${title} passionate about solving complex domain problems. Skilled in ${topSkills}, agile delivery, and driving user-centric outcomes in high-velocity organizations.`
      ];
      generated = suggestions[Math.floor(Math.random() * suggestions.length)];
      showToast('Applied curated smart summary!', 'info');
    }

    p.summary = generated;
    setVal('field-summary', generated);
    saveState();
    updateLivePreview();
  }


  // Render Experience List in Editor
  function renderExperienceList() {
    const container = document.getElementById('experience-cards-container');
    if (!container) return;
    container.innerHTML = '';

    (resumeState.experience || []).forEach((exp, index) => {
      const card = document.createElement('div');
      card.className = 'item-editor-card';
      card.innerHTML = `
        <div class="card-top-bar">
          <div class="card-title-preview">${escapeHtml(exp.title || 'Untitled Role')} — <span style="color:var(--text-secondary);font-weight:400;">${escapeHtml(exp.company || 'Company')}</span></div>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost btn-sm btn-delete-item" title="Delete position">✕</button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Job Title</label>
            <input type="text" class="form-input exp-title" value="${escapeHtml(exp.title || '')}" placeholder="e.g. Lead Engineer">
          </div>
          <div class="form-group">
            <label class="form-label">Company / Organization</label>
            <input type="text" class="form-input exp-company" value="${escapeHtml(exp.company || '')}" placeholder="e.g. Google">
          </div>
        </div>

        <div class="form-row three-col">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input exp-location" value="${escapeHtml(exp.location || '')}" placeholder="e.g. New York, NY">
          </div>
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="text" class="form-input exp-start" value="${escapeHtml(exp.startDate || '')}" placeholder="e.g. 2021-03">
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="text" class="form-input exp-end" value="${escapeHtml(exp.endDate || '')}" placeholder="e.g. Present" ${exp.current ? 'disabled' : ''}>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label class="checkbox-label">
            <input type="checkbox" class="exp-current" ${exp.current ? 'checked' : ''}>
            <span>I currently work in this role</span>
          </label>
        </div>

        <div class="bullets-manager">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <label class="form-label" style="margin:0;">Key Responsibilities & Achievements</label>
            <div style="display:flex; gap: 6px;">
              <button type="button" class="badge-tag-btn btn-open-verbs-helper">⚡ All Verbs</button>
              <button type="button" class="btn btn-secondary btn-sm btn-add-bullet">+ Bullet</button>
            </div>
          </div>
          <div class="quick-verbs-bar" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Top Verbs:</span>
            <button type="button" class="verb-quick-pill" data-verb="Spearheaded">Spearheaded</button>
            <button type="button" class="verb-quick-pill" data-verb="Architected">Architected</button>
            <button type="button" class="verb-quick-pill" data-verb="Accelerated">Accelerated</button>
            <button type="button" class="verb-quick-pill" data-verb="Engineered">Engineered</button>
            <button type="button" class="verb-quick-pill" data-verb="Orchestrated">Orchestrated</button>
          </div>
          <div class="bullets-list">
            ${(exp.bullets || []).map((b, bIndex) => `
              <div class="bullet-row" data-bullet-idx="${bIndex}">
                <textarea class="form-textarea bullet-input" rows="2" placeholder="Begin with a strong action verb (Spearheaded, Architected, Accelerated)...">${escapeHtml(b)}</textarea>
                <button type="button" class="btn btn-ghost btn-sm btn-del-bullet" title="Remove bullet">✕</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Event handlers for inputs in this card
      const titleInput = card.querySelector('.exp-title');
      const companyInput = card.querySelector('.exp-company');
      const locationInput = card.querySelector('.exp-location');
      const startInput = card.querySelector('.exp-start');
      const endInput = card.querySelector('.exp-end');
      const currentInput = card.querySelector('.exp-current');
      const deleteBtn = card.querySelector('.btn-delete-item');
      const addBulletBtn = card.querySelector('.btn-add-bullet');
      const verbsBtn = card.querySelector('.btn-open-verbs-helper');

      titleInput.addEventListener('input', (e) => {
        exp.title = e.target.value;
        card.querySelector('.card-title-preview').innerHTML = `${escapeHtml(exp.title || 'Untitled Role')} — <span style="color:var(--text-secondary);font-weight:400;">${escapeHtml(exp.company || 'Company')}</span>`;
        saveState();
        updateLivePreview();
      });

      companyInput.addEventListener('input', (e) => {
        exp.company = e.target.value;
        card.querySelector('.card-title-preview').innerHTML = `${escapeHtml(exp.title || 'Untitled Role')} — <span style="color:var(--text-secondary);font-weight:400;">${escapeHtml(exp.company || 'Company')}</span>`;
        saveState();
        updateLivePreview();
      });

      locationInput.addEventListener('input', (e) => {
        exp.location = e.target.value;
        saveState();
        updateLivePreview();
      });

      startInput.addEventListener('input', (e) => {
        exp.startDate = e.target.value;
        saveState();
        updateLivePreview();
      });

      endInput.addEventListener('input', (e) => {
        exp.endDate = e.target.value;
        saveState();
        updateLivePreview();
      });

      currentInput.addEventListener('change', (e) => {
        exp.current = e.target.checked;
        endInput.disabled = exp.current;
        if (exp.current) endInput.value = '';
        saveState();
        updateLivePreview();
      });

      deleteBtn.addEventListener('click', () => {
        resumeState.experience.splice(index, 1);
        saveState();
        renderExperienceList();
        updateLivePreview();
        showToast('Position removed');
      });

      // Bullets management
      const bulletInputs = card.querySelectorAll('.bullet-input');
      bulletInputs.forEach((bIn, bIdx) => {
        bIn.addEventListener('input', (e) => {
          exp.bullets[bIdx] = e.target.value;
          saveState();
          updateLivePreview();
        });
        bIn.addEventListener('focus', () => {
          activeBulletTarget = bIn;
        });
      });

      const delBulletBtns = card.querySelectorAll('.btn-del-bullet');
      delBulletBtns.forEach((delBtn, bIdx) => {
        delBtn.addEventListener('click', () => {
          exp.bullets.splice(bIdx, 1);
          saveState();
          renderExperienceList();
          updateLivePreview();
        });
      });

      addBulletBtn.addEventListener('click', () => {
        if (!exp.bullets) exp.bullets = [];
        const templates = [
          'Spearheaded key architecture initiative, achieving 30% performance boost.',
          'Architected scalable microservices infrastructure handling 50k+ daily users.',
          'Accelerated release cycle from 3 weeks to 2 days through automated CI/CD pipelines.'
        ];
        const nextTemplate = templates[exp.bullets.length % templates.length];
        exp.bullets.push(nextTemplate);
        saveState();
        renderExperienceList();
        updateLivePreview();
        showToast('Added bullet with strong action verb!', 'info');
      });

      verbsBtn.addEventListener('click', () => {
        openActionVerbsModal(card.querySelector('.bullet-input'));
      });

      // Quick action verb pills inside this card
      card.querySelectorAll('.verb-quick-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const verb = pill.getAttribute('data-verb');
          let target = activeBulletTarget && card.contains(activeBulletTarget) 
            ? activeBulletTarget 
            : card.querySelector('.bullet-input');
          if (target) {
            target.value = applyVerbToBulletText(target.value, verb);
            target.dispatchEvent(new Event('input'));
            target.focus();
            showToast(`Applied "${verb}" to bullet point!`, 'success');
          } else {
            if (!exp.bullets) exp.bullets = [];
            exp.bullets.push(`${verb} core initiative resulting in measurable business growth.`);
            saveState();
            renderExperienceList();
            updateLivePreview();
            showToast(`Added bullet starting with "${verb}"`, 'success');
          }
        });
      });

      container.appendChild(card);
    });
  }

  // Render Education List
  function renderEducationList() {
    const container = document.getElementById('education-cards-container');
    if (!container) return;
    container.innerHTML = '';

    (resumeState.education || []).forEach((edu, index) => {
      const card = document.createElement('div');
      card.className = 'item-editor-card';
      card.innerHTML = `
        <div class="card-top-bar">
          <div class="card-title-preview">${escapeHtml(edu.degree || 'Degree')} — <span style="color:var(--text-secondary);font-weight:400;">${escapeHtml(edu.school || 'School')}</span></div>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost btn-sm btn-delete-edu" title="Delete degree">✕</button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Degree & Major</label>
            <input type="text" class="form-input edu-degree" value="${escapeHtml(edu.degree || '')}" placeholder="e.g. Master of Science in CS">
          </div>
          <div class="form-group">
            <label class="form-label">University / Institution</label>
            <input type="text" class="form-input edu-school" value="${escapeHtml(edu.school || '')}" placeholder="e.g. Stanford University">
          </div>
        </div>

        <div class="form-row three-col">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input edu-location" value="${escapeHtml(edu.location || '')}" placeholder="e.g. Stanford, CA">
          </div>
          <div class="form-group">
            <label class="form-label">Start Year</label>
            <input type="text" class="form-input edu-start" value="${escapeHtml(edu.startDate || '')}" placeholder="e.g. 2018">
          </div>
          <div class="form-group">
            <label class="form-label">End Year</label>
            <input type="text" class="form-input edu-end" value="${escapeHtml(edu.endDate || '')}" placeholder="e.g. 2022">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">GPA / Grade (Optional)</label>
            <input type="text" class="form-input edu-gpa" value="${escapeHtml(edu.gpa || '')}" placeholder="e.g. 3.9 / 4.0">
          </div>
          <div class="form-group">
            <label class="form-label">Honors / Activities</label>
            <input type="text" class="form-input edu-honors" value="${escapeHtml(edu.honors || '')}" placeholder="e.g. Summa Cum Laude, Teaching Assistant">
          </div>
        </div>
      `;

      card.querySelector('.edu-degree').addEventListener('input', (e) => {
        edu.degree = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.edu-school').addEventListener('input', (e) => {
        edu.school = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.edu-location').addEventListener('input', (e) => {
        edu.location = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.edu-start').addEventListener('input', (e) => {
        edu.startDate = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.edu-end').addEventListener('input', (e) => {
        edu.endDate = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.edu-gpa').addEventListener('input', (e) => {
        edu.gpa = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.edu-honors').addEventListener('input', (e) => {
        edu.honors = e.target.value;
        saveState();
        updateLivePreview();
      });

      card.querySelector('.btn-delete-edu').addEventListener('click', () => {
        resumeState.education.splice(index, 1);
        saveState();
        renderEducationList();
        updateLivePreview();
      });

      container.appendChild(card);
    });
  }

  // Render Skills Categories
  function renderSkillsList() {
    const container = document.getElementById('skills-categories-container');
    if (!container) return;
    container.innerHTML = '';

    (resumeState.skills || []).forEach((cat, index) => {
      const card = document.createElement('div');
      card.className = 'skill-cat-card';
      card.innerHTML = `
        <div class="card-top-bar" style="margin-bottom:8px;">
          <input type="text" class="form-input cat-name-input" value="${escapeHtml(cat.category || '')}" placeholder="Category Name" style="font-weight:700; max-width:260px;">
          <button type="button" class="btn btn-ghost btn-sm btn-del-cat" title="Delete category">✕</button>
        </div>

        <div style="display:flex; gap: 8px; margin-bottom: 8px;">
          <input type="text" class="form-input new-skill-input" placeholder="Type a skill & press Enter or Add..." style="flex:1;">
          <button type="button" class="btn btn-secondary btn-sm btn-add-tag-submit">+ Add</button>
        </div>

        <div class="chips-container">
          ${(cat.items || []).map((skill, sIdx) => `
            <span class="chip-tag">
              <span>${escapeHtml(skill)}</span>
              <button type="button" class="chip-delete-btn" data-sidx="${sIdx}">×</button>
            </span>
          `).join('')}
        </div>

        <div class="quick-chips-bar">
          <div class="quick-chips-title">Quick Add Popular Tags:</div>
          <div class="quick-chips-list">
            ${QUICK_SKILL_SUGGESTIONS.slice(0, 8).map(qs => `
              <button type="button" class="quick-add-chip" data-qs="${escapeHtml(qs)}">+ ${escapeHtml(qs)}</button>
            `).join('')}
          </div>
        </div>
      `;

      const catInput = card.querySelector('.cat-name-input');
      catInput.addEventListener('input', (e) => {
        cat.category = e.target.value;
        saveState();
        updateLivePreview();
      });

      const delCatBtn = card.querySelector('.btn-del-cat');
      delCatBtn.addEventListener('click', () => {
        resumeState.skills.splice(index, 1);
        saveState();
        renderSkillsList();
        updateLivePreview();
      });

      const newSkillIn = card.querySelector('.new-skill-input');
      const addTagSubmit = card.querySelector('.btn-add-tag-submit');

      function addSkill() {
        const val = newSkillIn.value.trim();
        if (val) {
          if (!cat.items) cat.items = [];
          cat.items.push(val);
          newSkillIn.value = '';
          saveState();
          renderSkillsList();
          updateLivePreview();
        }
      }

      newSkillIn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSkill();
        }
      });
      addTagSubmit.addEventListener('click', addSkill);

      // Delete chip
      card.querySelectorAll('.chip-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sIdx = parseInt(btn.getAttribute('data-sidx'), 10);
          cat.items.splice(sIdx, 1);
          saveState();
          renderSkillsList();
          updateLivePreview();
        });
      });

      // Quick suggestions
      card.querySelectorAll('.quick-add-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const qs = btn.getAttribute('data-qs');
          if (qs && !cat.items.includes(qs)) {
            cat.items.push(qs);
            saveState();
            renderSkillsList();
            updateLivePreview();
          }
        });
      });

      container.appendChild(card);
    });
  }

  // Render Projects List
  function renderProjectsList() {
    const container = document.getElementById('projects-cards-container');
    if (!container) return;
    container.innerHTML = '';

    (resumeState.projects || []).forEach((proj, index) => {
      const card = document.createElement('div');
      card.className = 'item-editor-card';
      card.innerHTML = `
        <div class="card-top-bar">
          <div class="card-title-preview">${escapeHtml(proj.name || 'Untitled Project')}</div>
          <button type="button" class="btn btn-ghost btn-sm btn-del-proj" title="Delete project">✕</button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Project Name</label>
            <input type="text" class="form-input proj-name" value="${escapeHtml(proj.name || '')}" placeholder="e.g. OmniStream Cloud">
          </div>
          <div class="form-group">
            <label class="form-label">Role or Contribution</label>
            <input type="text" class="form-input proj-role" value="${escapeHtml(proj.role || '')}" placeholder="e.g. Sole Creator">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Technologies Used</label>
            <input type="text" class="form-input proj-tech" value="${escapeHtml(proj.tech || '')}" placeholder="e.g. React, Go, Docker">
          </div>
          <div class="form-group">
            <label class="form-label">Live Link / Repository</label>
            <input type="text" class="form-input proj-link" value="${escapeHtml(proj.link || '')}" placeholder="e.g. https://github.com/...">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Project Impact & Description</label>
          <textarea class="form-textarea proj-desc" rows="2" placeholder="Brief description with metrics (e.g. 200k active users)...">${escapeHtml(proj.description || '')}</textarea>
        </div>
      `;

      card.querySelector('.proj-name').addEventListener('input', (e) => {
        proj.name = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.proj-role').addEventListener('input', (e) => {
        proj.role = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.proj-tech').addEventListener('input', (e) => {
        proj.tech = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.proj-link').addEventListener('input', (e) => {
        proj.link = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.proj-desc').addEventListener('input', (e) => {
        proj.description = e.target.value;
        saveState();
        updateLivePreview();
      });

      card.querySelector('.btn-del-proj').addEventListener('click', () => {
        resumeState.projects.splice(index, 1);
        saveState();
        renderProjectsList();
        updateLivePreview();
      });

      container.appendChild(card);
    });
  }

  // Render Certifications List
  function renderCertsList() {
    const container = document.getElementById('certs-cards-container');
    if (!container) return;
    container.innerHTML = '';

    (resumeState.certifications || []).forEach((c, index) => {
      const card = document.createElement('div');
      card.className = 'item-editor-card';
      card.innerHTML = `
        <div class="card-top-bar">
          <div class="card-title-preview">${escapeHtml(c.name || 'Certification')}</div>
          <button type="button" class="btn btn-ghost btn-sm btn-del-cert" title="Delete">✕</button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Certification Name</label>
            <input type="text" class="form-input cert-name" value="${escapeHtml(c.name || '')}" placeholder="e.g. AWS Solutions Architect">
          </div>
          <div class="form-group">
            <label class="form-label">Issuing Organization</label>
            <input type="text" class="form-input cert-issuer" value="${escapeHtml(c.issuer || '')}" placeholder="e.g. Amazon Web Services">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Issue Year</label>
            <input type="text" class="form-input cert-date" value="${escapeHtml(c.date || '')}" placeholder="e.g. 2023">
          </div>
          <div class="form-group">
            <label class="form-label">Credential ID / URL (Optional)</label>
            <input type="text" class="form-input cert-cred" value="${escapeHtml(c.credentialId || '')}" placeholder="e.g. AWS-12345">
          </div>
        </div>
      `;

      card.querySelector('.cert-name').addEventListener('input', (e) => {
        c.name = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.cert-issuer').addEventListener('input', (e) => {
        c.issuer = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.cert-date').addEventListener('input', (e) => {
        c.date = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.cert-cred').addEventListener('input', (e) => {
        c.credentialId = e.target.value;
        saveState();
        updateLivePreview();
      });

      card.querySelector('.btn-del-cert').addEventListener('click', () => {
        resumeState.certifications.splice(index, 1);
        saveState();
        renderCertsList();
        updateLivePreview();
      });

      container.appendChild(card);
    });
  }

  // Render Languages List
  function renderLanguagesList() {
    const container = document.getElementById('languages-cards-container');
    if (!container) return;
    container.innerHTML = '';

    (resumeState.languages || []).forEach((l, index) => {
      const card = document.createElement('div');
      card.className = 'item-editor-card';
      card.innerHTML = `
        <div class="card-top-bar" style="margin-bottom:8px;">
          <div class="card-title-preview">${escapeHtml(l.name || 'Language')}</div>
          <button type="button" class="btn btn-ghost btn-sm btn-del-lang" title="Delete">✕</button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Language</label>
            <input type="text" class="form-input lang-name" value="${escapeHtml(l.name || '')}" placeholder="e.g. English">
          </div>
          <div class="form-group">
            <label class="form-label">Proficiency</label>
            <input type="text" class="form-input lang-level" value="${escapeHtml(l.level || '')}" placeholder="e.g. Native / Fluent / Intermediate">
          </div>
        </div>
      `;

      card.querySelector('.lang-name').addEventListener('input', (e) => {
        l.name = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.lang-level').addEventListener('input', (e) => {
        l.level = e.target.value;
        saveState();
        updateLivePreview();
      });
      card.querySelector('.btn-del-lang').addEventListener('click', () => {
        resumeState.languages.splice(index, 1);
        saveState();
        renderLanguagesList();
        updateLivePreview();
      });

      container.appendChild(card);
    });
  }

  // Setup Design Controls (Template grid, colors, fonts, density)
  function setupDesignControls() {
    if (!resumeState.settings) {
      resumeState.settings = {
        template: 'modern',
        primaryColor: '#2563eb',
        secondaryColor: '#1e293b',
        fontFamily: 'Inter',
        fontSize: 'normal'
      };
    }

    // Template grid
    const templateGrid = document.getElementById('template-selector-grid');
    if (templateGrid) {
      templateGrid.innerHTML = TEMPLATES.map(t => `
        <div class="template-card ${resumeState.settings.template === t.id ? 'active' : ''}" data-tid="${t.id}">
          <div class="template-card-name">${escapeHtml(t.name)}</div>
          <div class="template-card-desc">${escapeHtml(t.tag)}</div>
        </div>
      `).join('');

      templateGrid.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
          templateGrid.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          resumeState.settings.template = card.getAttribute('data-tid');
          saveState();
          updateLivePreview();
          showToast(`Switched to ${card.querySelector('.template-card-name').textContent} template`);
        });
      });
    }

    // Color Swatches
    const swatchContainer = document.getElementById('color-palette-swatches');
    if (swatchContainer) {
      swatchContainer.innerHTML = COLOR_PALETTES.map(p => `
        <button type="button" class="color-swatch-btn ${resumeState.settings.primaryColor === p.primary ? 'active' : ''}" 
          data-color="${p.primary}" title="${escapeHtml(p.name)}" style="background-color: ${p.primary};"></button>
      `).join('');

      swatchContainer.querySelectorAll('.color-swatch-btn').forEach(swatch => {
        swatch.addEventListener('click', () => {
          swatchContainer.querySelectorAll('.color-swatch-btn').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          resumeState.settings.primaryColor = swatch.getAttribute('data-color');
          saveState();
          updateLivePreview();
        });
      });
    }

    // Font selector
    const fontSelect = document.getElementById('setting-font-family');
    if (fontSelect) {
      fontSelect.value = resumeState.settings.fontFamily || 'Inter';
      fontSelect.addEventListener('change', (e) => {
        resumeState.settings.fontFamily = e.target.value;
        saveState();
        updateLivePreview();
      });
    }

    // Font size density selector
    const sizeSelect = document.getElementById('setting-font-size');
    if (sizeSelect) {
      sizeSelect.value = resumeState.settings.fontSize || 'normal';
      sizeSelect.addEventListener('change', (e) => {
        resumeState.settings.fontSize = e.target.value;
        saveState();
        updateLivePreview();
      });
    }
  }

  // Update Live Preview Canvas
  function updateLivePreview() {
    const mount = document.getElementById('resume-render-mount');
    if (!mount) return;

    // Render HTML template
    mount.innerHTML = renderResume(resumeState);

    // Apply CSS Custom Properties
    const s = resumeState.settings || {};
    const primaryColor = s.primaryColor || '#2563eb';
    const fontFamily = s.fontFamily ? `'${s.fontFamily}', sans-serif` : "'Inter', sans-serif";

    let fontSize = '13.5px';
    if (s.fontSize === 'compact') fontSize = '12px';
    if (s.fontSize === 'relaxed') fontSize = '14.5px';

    document.documentElement.style.setProperty('--resume-primary', primaryColor);
    document.documentElement.style.setProperty('--resume-font', fontFamily);
    document.documentElement.style.setProperty('--resume-font-size', fontSize);

    // Recalculate layout bounds, margin compensation & page break guides
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        adjustViewportScroll();
      });
    } else {
      adjustViewportScroll();
    }

    // Calculate ATS Score
    const analysis = calculateResumeScore(resumeState);
    updateAtsUI(analysis);
  }

  // ATS UI Update
  function updateAtsUI(analysis) {
    const headerPill = document.getElementById('header-ats-score');
    if (headerPill) {
      headerPill.textContent = `ATS Score: ${analysis.score}/100`;
    }

    const bigScore = document.getElementById('ats-big-score');
    if (bigScore) {
      bigScore.textContent = analysis.score;
      if (analysis.score >= 85) {
        bigScore.style.color = '#34d399';
      } else if (analysis.score >= 65) {
        bigScore.style.color = '#fbbf24';
      } else {
        bigScore.style.color = '#f87171';
      }
    }

    const passedList = document.getElementById('ats-passed-list');
    if (passedList) {
      passedList.innerHTML = analysis.checks.map(c => `
        <div class="ats-item passed">
          <span class="icon-check">✓</span>
          <span>${escapeHtml(c.text)}</span>
        </div>
      `).join('');
    }

    const tipsList = document.getElementById('ats-tips-list');
    if (tipsList) {
      if (analysis.tips.length === 0) {
        tipsList.innerHTML = '<div class="ats-item" style="color:#34d399;">🌟 Outstanding! Your resume meets all top ATS and recruiter criteria.</div>';
      } else {
        tipsList.innerHTML = analysis.tips.map(t => {
          const isActionVerbTip = t.toLowerCase().includes('action verbs') || t.toLowerCase().includes('spearheaded');
          return `
            <div class="ats-item" style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="icon-tip">💡</span>
                <span>${escapeHtml(t)}</span>
              </div>
              ${isActionVerbTip ? `
                <div style="margin-left: 24px; margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap;">
                  <button type="button" class="btn btn-primary btn-xs btn-quick-fix-verbs" style="font-size: 11px; padding: 3px 9px;">
                    ⚡ Auto-Fix All Bullets
                  </button>
                  <button type="button" class="btn btn-secondary btn-xs btn-open-verbs-from-tip" style="font-size: 11px; padding: 3px 9px;">
                    📖 Verbs Library
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');

        tipsList.querySelectorAll('.btn-quick-fix-verbs').forEach(btn => {
          btn.addEventListener('click', () => {
            enhanceAllBulletsWithActionVerbs();
          });
        });

        tipsList.querySelectorAll('.btn-open-verbs-from-tip').forEach(btn => {
          btn.addEventListener('click', () => {
            openActionVerbsModal();
          });
        });
      }
    }
  }

  // Zoom Controls & Smooth Vertical Viewport Engine
  function setupZoomControls() {
    const zoomIn = document.getElementById('btn-zoom-in');
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomFit = document.getElementById('btn-zoom-fit');
    const zoom100 = document.getElementById('btn-zoom-100');
    const zoomIndicator = document.getElementById('zoom-indicator');
    const wrapper = document.getElementById('preview-scale-wrapper');
    const viewport = document.getElementById('preview-viewport');
    const btnScrollTop = document.getElementById('btn-scroll-preview-top');

    function applyZoom(zoom) {
      currentZoom = Math.max(0.4, Math.min(1.4, Math.round(zoom * 100) / 100));
      if (wrapper) {
        wrapper.style.transform = `scale(${currentZoom})`;
      }
      if (zoomIndicator) {
        zoomIndicator.textContent = `${Math.round(currentZoom * 100)}%`;
      }
      adjustViewportScroll();
    }

    if (zoomIn) zoomIn.addEventListener('click', () => applyZoom(currentZoom + 0.08));
    if (zoomOut) zoomOut.addEventListener('click', () => applyZoom(currentZoom - 0.08));
    if (zoom100) zoom100.addEventListener('click', () => applyZoom(1.0));
    if (zoomFit) zoomFit.addEventListener('click', autoFitZoom);

    // Smooth Mouse Wheel: Ctrl/Cmd + Wheel = Zoom; Normal Wheel = Smooth Vertical Scroll
    if (viewport) {
      viewport.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const zoomDelta = e.deltaY < 0 ? 0.06 : -0.06;
          applyZoom(currentZoom + zoomDelta);
        }
      }, { passive: false });

      // Floating Scroll-to-Top Button visibility toggle
      viewport.addEventListener('scroll', () => {
        if (btnScrollTop) {
          if (viewport.scrollTop > 220) {
            btnScrollTop.classList.add('visible');
          } else {
            btnScrollTop.classList.remove('visible');
          }
        }
      });
    }

    // Scroll to Top action
    if (btnScrollTop && viewport) {
      btnScrollTop.addEventListener('click', () => {
        viewport.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Window resize handler: re-adjust scroll margin
    window.addEventListener('resize', () => {
      adjustViewportScroll();
    });
  }

  function autoFitZoom() {
    const viewport = document.getElementById('preview-viewport');
    const wrapper = document.getElementById('preview-scale-wrapper');
    const zoomIndicator = document.getElementById('zoom-indicator');
    if (!viewport || !wrapper) return;

    const availableWidth = viewport.clientWidth - 80; // Margin padding
    const sheetWidth = 794; // approx A4 width in px at 96 DPI
    let scale = availableWidth / sheetWidth;
    scale = Math.max(0.45, Math.min(1.05, Math.round(scale * 100) / 100));

    currentZoom = scale;
    wrapper.style.transform = `scale(${currentZoom})`;
    if (zoomIndicator) {
      zoomIndicator.textContent = `${Math.round(currentZoom * 100)}%`;
    }
    adjustViewportScroll();
  }

  // Adjust Viewport Scroll Bounds to prevent CSS transform scale clipping or dead space
  function adjustViewportScroll() {
    const wrapper = document.getElementById('preview-scale-wrapper');
    if (!wrapper) return;

    const sheet = wrapper.querySelector('.resume-sheet');
    if (!sheet) return;

    // Standard A4 height is 1123px (297mm at 96 DPI)
    const naturalHeight = sheet.offsetHeight || 1123;
    const scaledHeight = naturalHeight * currentZoom;
    const diff = scaledHeight - naturalHeight;

    // Compensate layout box margin so the parent viewport scroll container
    // accounts for CSS transform scaling without bottom clipping or empty dead space
    const targetMargin = Math.round(diff + 60);
    wrapper.style.marginBottom = `${targetMargin}px`;

    // Update dynamic A4 Page Break Guide and Page Count Badge
    updatePageBreakGuide(naturalHeight);
  }

  // Visual A4 Page-Break Guide Generator
  function updatePageBreakGuide(sheetHeight) {
    const wrapper = document.getElementById('preview-scale-wrapper');
    if (!wrapper) return;

    // Clear old page break indicators
    wrapper.querySelectorAll('.page-break-indicator').forEach(el => el.remove());

    const A4_HEIGHT = 1123; // 297mm in pixels at standard 96 DPI
    const pageCount = Math.max(1, Math.ceil((sheetHeight - 12) / A4_HEIGHT));

    // Update toolbar page count badge
    const pageBadge = document.getElementById('preview-page-count');
    if (pageBadge) {
      pageBadge.textContent = `${pageCount} Page${pageCount > 1 ? 's' : ''} (A4)`;
      if (pageCount > 1) {
        pageBadge.style.background = 'rgba(239, 68, 68, 0.18)';
        pageBadge.style.color = '#f87171';
        pageBadge.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      } else {
        pageBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        pageBadge.style.color = '#34d399';
        pageBadge.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      }
    }

    // Insert visual page boundary indicators when resume nears or overflows standard A4 height
    if (sheetHeight > A4_HEIGHT * 0.94) {
      for (let p = 1; p <= pageCount; p++) {
        const breakPos = p * A4_HEIGHT;
        if (breakPos <= sheetHeight + 120) {
          const indicator = document.createElement('div');
          indicator.className = 'page-break-indicator';
          indicator.style.top = `${breakPos}px`;
          indicator.innerHTML = `
            <div class="page-break-badge">
              Page ${p} / Page ${p + 1} Boundary (297mm Cutoff)
            </div>
          `;
          wrapper.appendChild(indicator);
        }
      }
    }
  }

  // Action Verbs Modal Setup
  function setupActionVerbsModal() {
    const modal = document.getElementById('verbs-modal');
    const closeBtn = document.getElementById('btn-close-verbs');
    const body = document.getElementById('verbs-modal-body');

    if (!modal || !body) return;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });

    body.innerHTML = `
      <div class="verbs-category" style="background: rgba(59,130,246,0.1); padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid rgba(59,130,246,0.3);">
        <div class="verbs-cat-title" style="color: #60a5fa; font-size: 12.5px; margin-bottom: 6px;">⭐ Top Recommended ATS Action Verbs</div>
        <div class="verbs-tags-list">
          <button type="button" class="verb-tag-btn" data-verb="Spearheaded" style="background: var(--accent-blue); color: #fff; font-weight: 700;">✦ Spearheaded</button>
          <button type="button" class="verb-tag-btn" data-verb="Architected" style="background: var(--accent-blue); color: #fff; font-weight: 700;">✦ Architected</button>
          <button type="button" class="verb-tag-btn" data-verb="Accelerated" style="background: var(--accent-blue); color: #fff; font-weight: 700;">✦ Accelerated</button>
          <button type="button" class="verb-tag-btn" data-verb="Engineered" style="background: rgba(59,130,246,0.25); color: #93c5fd; font-weight: 600;">Engineered</button>
          <button type="button" class="verb-tag-btn" data-verb="Orchestrated" style="background: rgba(59,130,246,0.25); color: #93c5fd; font-weight: 600;">Orchestrated</button>
        </div>
      </div>
      ${Object.entries(ACTION_VERBS).map(([category, verbs]) => `
        <div class="verbs-category">
          <div class="verbs-cat-title">${escapeHtml(category)}</div>
          <div class="verbs-tags-list">
            ${verbs.map(v => `<button type="button" class="verb-tag-btn" data-verb="${v}">${v}</button>`).join('')}
          </div>
        </div>
      `).join('')}
    `;

    body.querySelectorAll('.verb-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const verb = btn.getAttribute('data-verb');
        if (activeBulletTarget) {
          activeBulletTarget.value = applyVerbToBulletText(activeBulletTarget.value, verb);
          activeBulletTarget.dispatchEvent(new Event('input'));
          showToast(`Applied "${verb}" to bullet point!`, 'success');
        } else {
          navigator.clipboard?.writeText(verb);
          showToast(`Copied "${verb}" to clipboard!`, 'info');
        }
        modal.classList.remove('open');
      });
    });
  }

  // Intelligent Action Verb Replacement Helper
  function applyVerbToBulletText(text, verb) {
    if (!text || !text.trim()) {
      return `${verb} `;
    }
    let clean = text.trim().replace(/^["'“‘•\-\*\s]+/, '');
    const weakPrefixes = [
      /^responsible for (?:the |our )?/i,
      /^helped (?:with|to) (?:the |our )?/i,
      /^helped (?:the |our )?/i,
      /^worked on (?:the |our )?/i,
      /^working on (?:the |our )?/i,
      /^participated in (?:the |our )?/i,
      /^assisted (?:in|with) (?:the |our )?/i,
      /^was in charge of (?:the |our )?/i,
      /^in charge of (?:the |our )?/i,
      /^handled (?:the |our )?/i,
      /^managed (?:the |our )?/i,
      /^created (?:a |the |our )?/i,
      /^built (?:a |the |our )?/i,
      /^made (?:a |the |our )?/i,
      /^did (?:a |the |our )?/i,
      /^[A-Za-z]+(?:ed|ing|s)?\s+/
    ];
    for (const rx of weakPrefixes) {
      if (rx.test(clean)) {
        clean = clean.replace(rx, '');
        break;
      }
    }
    if (clean) {
      clean = clean.charAt(0).toLowerCase() + clean.slice(1);
      return `${verb} ${clean}`;
    }
    return `${verb} `;
  }

  // Auto-Enhance All Bullets Across All Experience Roles
  function enhanceAllBulletsWithActionVerbs() {
    if (!resumeState.experience || resumeState.experience.length === 0) {
      showToast('Add at least one work experience entry first.', 'info');
      return;
    }

    const priorityVerbs = ['Spearheaded', 'Architected', 'Accelerated', 'Engineered', 'Orchestrated'];
    let upgradedCount = 0;
    let verbIdx = 0;

    resumeState.experience.forEach(exp => {
      if (!Array.isArray(exp.bullets)) return;
      exp.bullets = exp.bullets.map(b => {
        const clean = b.trim().replace(/^["'“‘•\-\*\s]+/, '');
        const firstWord = clean.split(/\s+/)[0]?.toLowerCase().replace(/[^\w]/g, '');
        const allVerbs = Object.values(ACTION_VERBS).flat().map(v => v.toLowerCase());
        const hasStrongVerb = firstWord && (
          allVerbs.some(v => firstWord === v || firstWord.startsWith(v.slice(0, 4))) ||
          ['spearheaded', 'architected', 'accelerated', 'engineered', 'orchestrated'].includes(firstWord)
        );

        if (!hasStrongVerb) {
          const chosenVerb = priorityVerbs[verbIdx % priorityVerbs.length];
          verbIdx++;
          upgradedCount++;
          return applyVerbToBulletText(b, chosenVerb);
        }
        return b;
      });
    });

    saveState();
    renderExperienceList();
    updateLivePreview();

    if (upgradedCount > 0) {
      showToast(`Enhanced ${upgradedCount} bullet(s) with strong action verbs (Spearheaded, Architected, Accelerated)! ⚡`, 'success');
    } else {
      showToast('All bullets already begin with strong action verbs! 🌟', 'success');
    }
  }

  function openActionVerbsModal(targetInput) {
    if (targetInput) activeBulletTarget = targetInput;
    const modal = document.getElementById('verbs-modal');
    if (modal) modal.classList.add('open');
  }

  // ===========================================================================
  // ⚡ SUPABASE CLOUD SYNC & CLIENT INTEGRATION
  // ===========================================================================
  let supabaseClient = null;

  function initSupabaseClient() {
    try {
      const url = (window.SUPABASE_KEYS && window.SUPABASE_KEYS.url) || 
                  (window.APP_CONFIG && window.APP_CONFIG.supabase && window.APP_CONFIG.supabase.url);
      const anonKey = (window.SUPABASE_KEYS && window.SUPABASE_KEYS.anonKey) || 
                      (window.APP_CONFIG && window.APP_CONFIG.supabase && window.APP_CONFIG.supabase.anonKey);

      if (url && anonKey && !url.includes('YOUR_') && !url.includes('PASTE_YOUR') && window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(url, anonKey);
        window.supabaseClient = supabaseClient;
      }
    } catch (e) {
      console.warn('Supabase client init warning:', e);
    }
  }

  async function checkSupabaseHealth() {
    const pill = document.getElementById('supabase-status-pill');
    const text = document.getElementById('supabase-status-text');
    if (!pill || !text) return;

    // Check through backend API or directly through Supabase client
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          pill.classList.remove('error');
          pill.classList.add('connected');
          text.textContent = 'Supabase Live';
          pill.title = `Connected to Supabase PostgreSQL • ${data.resumesCount} resume(s) in cloud`;
          return;
        }
      }
    } catch (e) {}

    if (supabaseClient) {
      try {
        const { count, error } = await supabaseClient.from('resumes').select('*', { count: 'exact', head: true });
        if (!error) {
          pill.classList.remove('error');
          pill.classList.add('connected');
          text.textContent = 'Supabase Live';
          pill.title = `Connected directly to Supabase Cloud • ${count || 0} resume(s) in cloud`;
          return;
        }
      } catch (err) {
        console.warn('Direct Supabase check error:', err);
      }
    }

    pill.classList.remove('connected');
    pill.classList.add('error');
    text.textContent = 'Offline';
    pill.title = 'Supabase is currently offline or unreachable. Check API keys in backend/.env or frontend/supabase/supabase-keys.js.';
  }

  // Save current resume to Supabase Cloud
  async function saveResumeToCloud() {
    const saveBtn = document.getElementById('btn-cloud-save');
    const origHtml = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>⏳</span> Saving...';
    }

    const analysis = calculateResumeScore(resumeState);
    const p = resumeState.personal || {};
    const title = p.fullName ? `${p.fullName} - ${p.title || 'Resume'}` : (resumeState.title || 'My Professional Resume');

    const payload = {
      id: resumeState.cloudResumeId || undefined,
      title: title,
      personal: resumeState.personal || {},
      experience: resumeState.experience || [],
      education: resumeState.education || [],
      skills: resumeState.skills || [],
      projects: resumeState.projects || [],
      certifications: resumeState.certifications || [],
      languages: resumeState.languages || [],
      settings: resumeState.settings || {},
      atsScore: analysis.score || 0,
      isPublic: true
    };

    try {
      let savedResume = null;

      // Try Backend endpoint first (uses service role key if needed)
      try {
        const res = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.resume) {
            savedResume = result.resume;
          }
        }
      } catch (e) {}

      // Fallback: direct browser Supabase client
      if (!savedResume && supabaseClient) {
        const dbPayload = {
          title: payload.title,
          personal_info: payload.personal,
          experience: payload.experience,
          education: payload.education,
          skills: payload.skills,
          projects: payload.projects,
          certifications: payload.certifications,
          languages: payload.languages,
          settings: payload.settings,
          ats_score: payload.atsScore,
          is_public: true
        };

        if (payload.id) {
          const { data, error } = await supabaseClient
            .from('resumes')
            .update(dbPayload)
            .eq('id', payload.id)
            .select()
            .single();
          if (error) throw error;
          savedResume = data;
        } else {
          const { data, error } = await supabaseClient
            .from('resumes')
            .insert(dbPayload)
            .select()
            .single();
          if (error) throw error;
          savedResume = data;
        }
      }

      if (!savedResume) {
        throw new Error('Failed to reach Supabase backend or database client');
      }

      resumeState.cloudResumeId = savedResume.id;
      resumeState.cloudShareId = savedResume.share_id;
      saveState();

      showToast('Resume saved to Supabase Cloud! ☁️', 'success');
      checkSupabaseHealth();
    } catch (err) {
      console.error('Cloud Save Error:', err);
      showToast(`Cloud save error: ${err.message}`, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origHtml;
      }
    }
  }

  // Open Supabase Cloud Resumes Modal
  async function openCloudModal() {
    const modal = document.getElementById('cloud-modal');
    const body = document.getElementById('cloud-modal-body');
    if (!modal || !body) return;

    modal.classList.add('open');
    body.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <div style="font-size: 28px; margin-bottom: 10px;">⏳</div>
        <div>Loading cloud resumes from Supabase...</div>
      </div>
    `;

    try {
      let resumes = null;

      // Try Backend endpoint
      try {
        const res = await fetch('/api/resumes');
        if (res.ok) {
          const data = await res.json();
          if (data.success) resumes = data.resumes;
        }
      } catch (e) {}

      // Direct client fallback
      if (!resumes && supabaseClient) {
        const { data, error } = await supabaseClient
          .from('resumes')
          .select('id, title, slug, share_id, ats_score, is_public, updated_at, created_at')
          .order('updated_at', { ascending: false });
        if (!error) resumes = data;
      }

      if (!resumes || resumes.length === 0) {
        body.innerHTML = `
          <div class="cloud-empty-state">
            <div class="cloud-empty-icon">☁️</div>
            <h3 style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">No Resumes in Supabase Yet</h3>
            <p style="font-size: 13px; max-width: 420px; margin: 0 auto 20px;">
              Your Supabase PostgreSQL database is connected and active. Click "Save Current Resume Now" to store your resume in the cloud.
            </p>
            <button type="button" class="btn btn-primary btn-sm" id="btn-cloud-save-from-empty">
              <span>☁️</span> Save Current Resume Now
            </button>
          </div>
        `;
        const emptySave = document.getElementById('btn-cloud-save-from-empty');
        if (emptySave) {
          emptySave.addEventListener('click', async () => {
            modal.classList.remove('open');
            await saveResumeToCloud();
          });
        }
        return;
      }

      // Render resumes list
      body.innerHTML = `
        <div class="cloud-resumes-list">
          ${resumes.map(r => {
            const dateStr = new Date(r.updated_at || r.created_at).toLocaleDateString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const ats = r.ats_score != null ? r.ats_score : '—';
            const isCurrent = resumeState.cloudResumeId === r.id;
            return `
              <div class="cloud-resume-card" data-id="${r.id}">
                <div class="cloud-card-info">
                  <div class="cloud-card-title">
                    ${escapeHtml(r.title || 'Untitled Resume')}
                    ${isCurrent ? '<span style="font-size: 11px; margin-left: 6px; padding: 2px 7px; background: rgba(59,130,246,0.2); color: #93c5fd; border-radius: 4px;">Active</span>' : ''}
                  </div>
                  <div class="cloud-card-meta">
                    <span>🕒 ${dateStr}</span>
                    <span class="cloud-badge-ats">ATS: ${ats}/100</span>
                    <span>Share ID: <code>${r.share_id || '—'}</code></span>
                  </div>
                </div>
                <div class="cloud-card-actions">
                  <button type="button" class="btn btn-secondary btn-sm btn-cloud-open" data-id="${r.id}">
                    <span>📂</span> Open
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm btn-cloud-share" data-share="${r.share_id}">
                    <span>🔗</span> Share
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm btn-cloud-delete" data-id="${r.id}" style="color: #f87171;" title="Delete from Supabase">
                    <span>🗑</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Event listeners for list items
      body.querySelectorAll('.btn-cloud-open').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          modal.classList.remove('open');
          loadResumeFromCloud(id);
        });
      });

      body.querySelectorAll('.btn-cloud-share').forEach(btn => {
        btn.addEventListener('click', () => {
          const shareId = btn.getAttribute('data-share');
          modal.classList.remove('open');
          openShareModal(shareId);
        });
      });

      body.querySelectorAll('.btn-cloud-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this resume from Supabase?')) {
            await deleteResumeFromCloud(id);
            openCloudModal(); // refresh view
          }
        });
      });
    } catch (err) {
      body.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #f87171;">
          <div>Failed to load resumes: ${escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }

  // Load a resume by ID from Supabase
  async function loadResumeFromCloud(id) {
    showToast('Fetching resume from Supabase Cloud...', 'info');
    try {
      let r = null;
      try {
        const res = await fetch(`/api/resumes/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) r = data.resume;
        }
      } catch (e) {}

      if (!r && supabaseClient) {
        const { data, error } = await supabaseClient.from('resumes').select('*').eq('id', id).single();
        if (!error) r = data;
      }

      if (!r) throw new Error('Resume not found in Supabase database');

      resumeState = {
        cloudResumeId: r.id,
        cloudShareId: r.share_id,
        title: r.title,
        personal: r.personal_info || {},
        experience: Array.isArray(r.experience) ? r.experience : [],
        education: Array.isArray(r.education) ? r.education : [],
        skills: Array.isArray(r.skills) ? r.skills : [],
        projects: Array.isArray(r.projects) ? r.projects : [],
        certifications: Array.isArray(r.certifications) ? r.certifications : [],
        languages: Array.isArray(r.languages) ? r.languages : [],
        settings: r.settings || { template: 'modern', primaryColor: '#2563eb', fontFamily: 'Inter', fontSize: 'normal' }
      };

      saveState();
      populateForm();
      setupDesignControls();
      updateLivePreview();
      showToast(`Loaded "${r.title || 'Resume'}" from Supabase! ☁️`, 'success');
    } catch (err) {
      console.error('Error loading resume:', err);
      showToast(`Failed to load resume: ${err.message}`, 'error');
    }
  }

  // Delete resume from Supabase
  async function deleteResumeFromCloud(id) {
    try {
      let deleted = false;
      try {
        const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
        if (res.ok) deleted = true;
      } catch (e) {}

      if (!deleted && supabaseClient) {
        const { error } = await supabaseClient.from('resumes').delete().eq('id', id);
        if (!error) deleted = true;
      }

      if (deleted) {
        if (resumeState.cloudResumeId === id) {
          delete resumeState.cloudResumeId;
          delete resumeState.cloudShareId;
          saveState();
        }
        showToast('Resume deleted from Supabase', 'success');
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (err) {
      showToast(`Error deleting resume: ${err.message}`, 'error');
    }
  }

  // Open Share Modal
  function openShareModal(shareId) {
    const sId = shareId || resumeState.cloudShareId;
    if (!sId) {
      if (confirm('This resume needs to be saved to Supabase Cloud before generating a share link. Save now?')) {
        saveResumeToCloud().then(() => {
          if (resumeState.cloudShareId) {
            openShareModal(resumeState.cloudShareId);
          }
        });
      }
      return;
    }

    const modal = document.getElementById('share-modal');
    const input = document.getElementById('share-link-input');
    if (!modal || !input) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${sId}`;
    input.value = shareUrl;
    modal.classList.add('open');
  }

  // Check URL params for ?share= or ?id=
  async function checkUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get('share');
      const resumeId = params.get('id');

      if (shareId) {
        showToast('Loading shared resume from Supabase...', 'info');
        try {
          const res = await fetch(`/api/resumes/share/${shareId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.resume) {
              const r = data.resume;
              resumeState = {
                cloudResumeId: r.id,
                cloudShareId: r.share_id,
                title: r.title,
                personal: r.personal_info || {},
                experience: r.experience || [],
                education: r.education || [],
                skills: r.skills || [],
                projects: r.projects || [],
                certifications: r.certifications || [],
                languages: r.languages || [],
                settings: r.settings || {}
              };
              populateForm();
              setupDesignControls();
              updateLivePreview();
              showToast(`Viewing shared resume: ${r.title}`, 'success');
              return;
            }
          }
        } catch (e) {}
      } else if (resumeId) {
        await loadResumeFromCloud(resumeId);
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
