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
    setupEventListeners();
    populateForm();
    setupDesignControls();
    updateLivePreview();
    autoFitZoom();
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
              <button type="button" class="badge-tag-btn btn-open-verbs-helper">⚡ Action Verbs</button>
              <button type="button" class="btn btn-secondary btn-sm btn-add-bullet">+ Bullet</button>
            </div>
          </div>
          <div class="bullets-list">
            ${(exp.bullets || []).map((b, bIndex) => `
              <div class="bullet-row" data-bullet-idx="${bIndex}">
                <textarea class="form-textarea bullet-input" rows="2" placeholder="Start with a strong action verb (e.g. Spearheaded, Engineered...)...">${escapeHtml(b)}</textarea>
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
        exp.bullets.push('Engineered new component improving workflow throughput by 20%.');
        saveState();
        renderExperienceList();
        updateLivePreview();
      });

      verbsBtn.addEventListener('click', () => {
        openActionVerbsModal(card.querySelector('.bullet-input'));
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
        tipsList.innerHTML = analysis.tips.map(t => `
          <div class="ats-item">
            <span class="icon-tip">💡</span>
            <span>${escapeHtml(t)}</span>
          </div>
        `).join('');
      }
    }
  }

  // Zoom Controls Implementation
  function setupZoomControls() {
    const zoomIn = document.getElementById('btn-zoom-in');
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomFit = document.getElementById('btn-zoom-fit');
    const zoom100 = document.getElementById('btn-zoom-100');
    const zoomIndicator = document.getElementById('zoom-indicator');
    const wrapper = document.getElementById('preview-scale-wrapper');

    function applyZoom(zoom) {
      currentZoom = Math.max(0.4, Math.min(1.4, zoom));
      if (wrapper) {
        wrapper.style.transform = `scale(${currentZoom})`;
      }
      if (zoomIndicator) {
        zoomIndicator.textContent = `${Math.round(currentZoom * 100)}%`;
      }
    }

    if (zoomIn) zoomIn.addEventListener('click', () => applyZoom(currentZoom + 0.08));
    if (zoomOut) zoomOut.addEventListener('click', () => applyZoom(currentZoom - 0.08));
    if (zoom100) zoom100.addEventListener('click', () => applyZoom(1.0));
    if (zoomFit) zoomFit.addEventListener('click', autoFitZoom);

    // Keyboard shortcuts (Cmd/Ctrl + & -)
    window.addEventListener('resize', () => {
      // Auto adjust if window resizes substantially
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
    scale = Math.max(0.45, Math.min(1.05, scale));

    currentZoom = scale;
    wrapper.style.transform = `scale(${currentZoom})`;
    if (zoomIndicator) {
      zoomIndicator.textContent = `${Math.round(currentZoom * 100)}%`;
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

    body.innerHTML = Object.entries(ACTION_VERBS).map(([category, verbs]) => `
      <div class="verbs-category">
        <div class="verbs-cat-title">${escapeHtml(category)}</div>
        <div class="verbs-tags-list">
          ${verbs.map(v => `<button type="button" class="verb-tag-btn" data-verb="${v}">${v}</button>`).join('')}
        </div>
      </div>
    `).join('');

    body.querySelectorAll('.verb-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const verb = btn.getAttribute('data-verb');
        if (activeBulletTarget) {
          activeBulletTarget.value = `${verb} ` + activeBulletTarget.value.replace(/^[A-Za-z]+ /, '');
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

  function openActionVerbsModal(targetInput) {
    if (targetInput) activeBulletTarget = targetInput;
    const modal = document.getElementById('verbs-modal');
    if (modal) modal.classList.add('open');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
