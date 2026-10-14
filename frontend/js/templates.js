// Resume Templates Renderer

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.toLowerCase() === 'present' || dateStr.toLowerCase() === 'current') return 'Present';
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }
  return dateStr;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatUrl(url) {
  if (!url) return '';
  let clean = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  return escapeHtml(clean);
}

function fullUrl(url) {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

// 1. MODERN EXECUTIVE TEMPLATE
function renderModernTemplate(resume) {
  const p = resume.personal || {};
  const showAvatar = p.showAvatar && p.avatar;

  return `
    <div class="resume-sheet modern-template" data-template="modern">
      <header class="resume-header modern-header">
        <div class="header-main">
          ${showAvatar ? `
            <div class="avatar-wrap">
              <img src="${p.avatar}" alt="${escapeHtml(p.fullName)}" class="avatar-img" onerror="this.style.display='none'">
            </div>
          ` : ''}
          <div class="header-title-group">
            <h1 class="candidate-name">${escapeHtml(p.fullName) || 'Your Name'}</h1>
            <div class="candidate-title">${escapeHtml(p.title) || 'Professional Title'}</div>
          </div>
        </div>

        <div class="header-contacts">
          ${p.email ? `<div class="contact-item"><i class="icon-mail"></i> <a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></div>` : ''}
          ${p.phone ? `<div class="contact-item"><i class="icon-phone"></i> <span>${escapeHtml(p.phone)}</span></div>` : ''}
          ${p.location ? `<div class="contact-item"><i class="icon-map-pin"></i> <span>${escapeHtml(p.location)}</span></div>` : ''}
          ${p.website ? `<div class="contact-item"><i class="icon-globe"></i> <a href="${fullUrl(p.website)}" target="_blank" rel="noopener">${formatUrl(p.website)}</a></div>` : ''}
          ${p.linkedin ? `<div class="contact-item"><i class="icon-linkedin"></i> <a href="${fullUrl(p.linkedin)}" target="_blank" rel="noopener">${formatUrl(p.linkedin)}</a></div>` : ''}
          ${p.github ? `<div class="contact-item"><i class="icon-github"></i> <a href="${fullUrl(p.github)}" target="_blank" rel="noopener">${formatUrl(p.github)}</a></div>` : ''}
        </div>
      </header>

      <div class="modern-body-layout">
        <!-- Main Column (Left/Wide) -->
        <main class="modern-main-col">
          ${p.summary ? `
            <section class="resume-section section-summary">
              <h2 class="section-heading"><span class="heading-icon">✦</span> Professional Profile</h2>
              <p class="summary-text">${escapeHtml(p.summary)}</p>
            </section>
          ` : ''}

          ${(resume.experience && resume.experience.length) ? `
            <section class="resume-section section-experience">
              <h2 class="section-heading"><span class="heading-icon">💼</span> Work Experience</h2>
              <div class="timeline-items">
                ${resume.experience.map(exp => `
                  <div class="timeline-item">
                    <div class="item-header">
                      <div>
                        <h3 class="item-title">${escapeHtml(exp.title)}</h3>
                        <div class="item-subtitle">${escapeHtml(exp.company)} ${exp.location ? `<span class="item-location">• ${escapeHtml(exp.location)}</span>` : ''}</div>
                      </div>
                      <div class="item-date">
                        ${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}
                      </div>
                    </div>
                    ${exp.bullets && exp.bullets.length ? `
                      <ul class="item-bullets">
                        ${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          ${(resume.projects && resume.projects.length) ? `
            <section class="resume-section section-projects">
              <h2 class="section-heading"><span class="heading-icon">🚀</span> Key Projects</h2>
              <div class="project-items">
                ${resume.projects.map(proj => `
                  <div class="project-card">
                    <div class="item-header">
                      <div class="project-title-row">
                        <h3 class="item-title">${escapeHtml(proj.name)}</h3>
                        ${proj.link ? `<a href="${fullUrl(proj.link)}" target="_blank" class="project-link" rel="noopener">↗ Visit</a>` : ''}
                      </div>
                      ${proj.tech ? `<div class="project-tech-badge">${escapeHtml(proj.tech)}</div>` : ''}
                    </div>
                    ${proj.role ? `<div class="project-role">${escapeHtml(proj.role)}</div>` : ''}
                    <p class="project-desc">${escapeHtml(proj.description)}</p>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}
        </main>

        <!-- Sidebar Column (Right) -->
        <aside class="modern-side-col">
          ${(resume.skills && resume.skills.length) ? `
            <section class="resume-section section-skills">
              <h2 class="section-heading"><span class="heading-icon">⚡</span> Skills & Tech</h2>
              <div class="skills-categories">
                ${resume.skills.map(cat => `
                  <div class="skill-category-block">
                    <div class="category-name">${escapeHtml(cat.category)}</div>
                    <div class="skill-tags">
                      ${(cat.items || []).map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          ${(resume.education && resume.education.length) ? `
            <section class="resume-section section-education">
              <h2 class="section-heading"><span class="heading-icon">🎓</span> Education</h2>
              <div class="education-items">
                ${resume.education.map(edu => `
                  <div class="edu-item">
                    <h3 class="item-title">${escapeHtml(edu.degree)}</h3>
                    <div class="edu-school">${escapeHtml(edu.school)}</div>
                    <div class="edu-meta">
                      ${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}
                      ${edu.gpa ? ` • GPA: ${escapeHtml(edu.gpa)}` : ''}
                    </div>
                    ${edu.honors ? `<div class="edu-honors">${escapeHtml(edu.honors)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          ${(resume.certifications && resume.certifications.length) ? `
            <section class="resume-section section-certs">
              <h2 class="section-heading"><span class="heading-icon">📜</span> Certifications</h2>
              <div class="certs-list">
                ${resume.certifications.map(cert => `
                  <div class="cert-item">
                    <div class="cert-name">${escapeHtml(cert.name)}</div>
                    <div class="cert-meta">${escapeHtml(cert.issuer)} ${cert.date ? `(${escapeHtml(cert.date)})` : ''}</div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          ${(resume.languages && resume.languages.length) ? `
            <section class="resume-section section-languages">
              <h2 class="section-heading"><span class="heading-icon">🌐</span> Languages</h2>
              <div class="languages-grid">
                ${resume.languages.map(lang => `
                  <div class="lang-row">
                    <span class="lang-name">${escapeHtml(lang.name)}</span>
                    <span class="lang-level">${escapeHtml(lang.level)}</span>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}
        </aside>
      </div>
    </div>
  `;
}

// 2. SILICON VALLEY TECH / ATS MINIMAL TEMPLATE
function renderTechTemplate(resume) {
  const p = resume.personal || {};

  return `
    <div class="resume-sheet tech-template" data-template="tech">
      <header class="tech-header">
        <h1 class="tech-candidate-name">${escapeHtml(p.fullName) || 'Your Name'}</h1>
        <div class="tech-candidate-title">${escapeHtml(p.title) || 'Professional Title'}</div>
        
        <div class="tech-contact-row">
          ${p.email ? `<span><i class="icon-mail"></i> <a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></span>` : ''}
          ${p.phone ? `<span><i class="icon-phone"></i> ${escapeHtml(p.phone)}</span>` : ''}
          ${p.location ? `<span><i class="icon-map-pin"></i> ${escapeHtml(p.location)}</span>` : ''}
          ${p.website ? `<span><i class="icon-globe"></i> <a href="${fullUrl(p.website)}" target="_blank">${formatUrl(p.website)}</a></span>` : ''}
          ${p.github ? `<span><i class="icon-github"></i> <a href="${fullUrl(p.github)}" target="_blank">${formatUrl(p.github)}</a></span>` : ''}
          ${p.linkedin ? `<span><i class="icon-linkedin"></i> <a href="${fullUrl(p.linkedin)}" target="_blank">${formatUrl(p.linkedin)}</a></span>` : ''}
        </div>
      </header>

      ${p.summary ? `
        <section class="tech-section">
          <h2 class="tech-heading">SUMMARY</h2>
          <div class="tech-heading-line"></div>
          <p class="tech-summary">${escapeHtml(p.summary)}</p>
        </section>
      ` : ''}

      ${(resume.skills && resume.skills.length) ? `
        <section class="tech-section">
          <h2 class="tech-heading">TECHNICAL COMPETENCIES</h2>
          <div class="tech-heading-line"></div>
          <div class="tech-skills-table">
            ${resume.skills.map(cat => `
              <div class="tech-skill-row">
                <span class="tech-skill-label">${escapeHtml(cat.category)}:</span>
                <span class="tech-skill-items">${(cat.items || []).map(s => escapeHtml(s)).join(', ')}</span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${(resume.experience && resume.experience.length) ? `
        <section class="tech-section">
          <h2 class="tech-heading">WORK EXPERIENCE</h2>
          <div class="tech-heading-line"></div>
          <div class="tech-experience-list">
            ${resume.experience.map(exp => `
              <div class="tech-exp-item">
                <div class="tech-role-header">
                  <div class="tech-role-left">
                    <span class="tech-role-title">${escapeHtml(exp.title)}</span>
                    <span class="tech-role-company"> | ${escapeHtml(exp.company)}</span>
                    ${exp.location ? `<span class="tech-role-loc"> — ${escapeHtml(exp.location)}</span>` : ''}
                  </div>
                  <div class="tech-role-date">
                    ${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}
                  </div>
                </div>
                ${exp.bullets && exp.bullets.length ? `
                  <ul class="tech-bullets">
                    ${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${(resume.projects && resume.projects.length) ? `
        <section class="tech-section">
          <h2 class="tech-heading">SELECTED PROJECTS</h2>
          <div class="tech-heading-line"></div>
          <div class="tech-projects-list">
            ${resume.projects.map(proj => `
              <div class="tech-project-item">
                <div class="tech-proj-header">
                  <span class="tech-proj-name">${escapeHtml(proj.name)}</span>
                  ${proj.tech ? `<span class="tech-proj-stack"> (${escapeHtml(proj.tech)})</span>` : ''}
                  ${proj.link ? `<a href="${fullUrl(proj.link)}" class="tech-proj-link" target="_blank">[View Project]</a>` : ''}
                </div>
                <p class="tech-proj-desc">${escapeHtml(proj.description)}</p>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${(resume.education && resume.education.length) ? `
        <section class="tech-section">
          <h2 class="tech-heading">EDUCATION</h2>
          <div class="tech-heading-line"></div>
          <div class="tech-edu-list">
            ${resume.education.map(edu => `
              <div class="tech-edu-item">
                <div class="tech-role-header">
                  <div class="tech-role-left">
                    <span class="tech-role-title">${escapeHtml(edu.degree)}</span>
                    <span class="tech-role-company"> | ${escapeHtml(edu.school)}</span>
                  </div>
                  <div class="tech-role-date">
                    ${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}
                  </div>
                </div>
                ${(edu.gpa || edu.honors) ? `
                  <div class="tech-edu-details">
                    ${edu.gpa ? `<span>GPA: ${escapeHtml(edu.gpa)}</span>` : ''}
                    ${edu.honors ? `<span> • ${escapeHtml(edu.honors)}</span>` : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${(resume.certifications && resume.certifications.length) ? `
        <section class="tech-section">
          <h2 class="tech-heading">CERTIFICATIONS & CREDENTIALS</h2>
          <div class="tech-heading-line"></div>
          <div class="tech-certs-list">
            ${resume.certifications.map(c => `
              <div class="tech-cert-row">
                <span class="tech-cert-name"><strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(c.issuer)}</span>
                <span class="tech-cert-date">${escapeHtml(c.date)}</span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
    </div>
  `;
}

// 3. CREATIVE STUDIO TEMPLATE
function renderCreativeTemplate(resume) {
  const p = resume.personal || {};
  const showAvatar = p.showAvatar && p.avatar;

  return `
    <div class="resume-sheet creative-template" data-template="creative">
      <aside class="creative-sidebar">
        ${showAvatar ? `
          <div class="creative-avatar-container">
            <img src="${p.avatar}" alt="${escapeHtml(p.fullName)}" class="creative-avatar-img" onerror="this.style.display='none'">
          </div>
        ` : ''}

        <div class="creative-sidebar-block">
          <h3 class="creative-side-title">Contact</h3>
          <div class="creative-side-contacts">
            ${p.email ? `<div><i class="icon-mail"></i> <a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></div>` : ''}
            ${p.phone ? `<div><i class="icon-phone"></i> ${escapeHtml(p.phone)}</div>` : ''}
            ${p.location ? `<div><i class="icon-map-pin"></i> ${escapeHtml(p.location)}</div>` : ''}
            ${p.website ? `<div><i class="icon-globe"></i> <a href="${fullUrl(p.website)}" target="_blank">${formatUrl(p.website)}</a></div>` : ''}
            ${p.linkedin ? `<div><i class="icon-linkedin"></i> <a href="${fullUrl(p.linkedin)}" target="_blank">${formatUrl(p.linkedin)}</a></div>` : ''}
            ${p.github ? `<div><i class="icon-github"></i> <a href="${fullUrl(p.github)}" target="_blank">${formatUrl(p.github)}</a></div>` : ''}
          </div>
        </div>

        ${(resume.skills && resume.skills.length) ? `
          <div class="creative-sidebar-block">
            <h3 class="creative-side-title">Expertise</h3>
            <div class="creative-skills">
              ${resume.skills.map(cat => `
                <div class="creative-skill-group">
                  <div class="creative-skill-cat">${escapeHtml(cat.category)}</div>
                  <div class="creative-pill-wrap">
                    ${(cat.items || []).map(skill => `<span class="creative-pill">${escapeHtml(skill)}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${(resume.languages && resume.languages.length) ? `
          <div class="creative-sidebar-block">
            <h3 class="creative-side-title">Languages</h3>
            <div class="creative-languages">
              ${resume.languages.map(l => `
                <div class="creative-lang-row">
                  <span>${escapeHtml(l.name)}</span>
                  <span class="creative-lang-tag">${escapeHtml(l.level)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${(resume.certifications && resume.certifications.length) ? `
          <div class="creative-sidebar-block">
            <h3 class="creative-side-title">Honors & Certs</h3>
            <div class="creative-certs">
              ${resume.certifications.map(c => `
                <div class="creative-cert-item">
                  <div class="creative-cert-title">${escapeHtml(c.name)}</div>
                  <div class="creative-cert-org">${escapeHtml(c.issuer)} • ${escapeHtml(c.date)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </aside>

      <main class="creative-content">
        <header class="creative-header">
          <div class="creative-badge">PORTFOLIO RESUME</div>
          <h1 class="creative-name">${escapeHtml(p.fullName) || 'Your Name'}</h1>
          <div class="creative-role">${escapeHtml(p.title) || 'Creative Professional'}</div>
          ${p.summary ? `<p class="creative-bio">${escapeHtml(p.summary)}</p>` : ''}
        </header>

        ${(resume.experience && resume.experience.length) ? `
          <section class="creative-section">
            <h2 class="creative-section-title">
              <span class="creative-num">01</span> Experience
            </h2>
            <div class="creative-timeline">
              ${resume.experience.map(exp => `
                <div class="creative-timeline-node">
                  <div class="node-bullet"></div>
                  <div class="node-content">
                    <div class="node-header">
                      <div>
                        <h3 class="node-title">${escapeHtml(exp.title)}</h3>
                        <div class="node-company">${escapeHtml(exp.company)} ${exp.location ? `· ${escapeHtml(exp.location)}` : ''}</div>
                      </div>
                      <span class="node-tag">${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                    </div>
                    ${exp.bullets && exp.bullets.length ? `
                      <ul class="node-bullets">
                        ${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                      </ul>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        ${(resume.projects && resume.projects.length) ? `
          <section class="creative-section">
            <h2 class="creative-section-title">
              <span class="creative-num">02</span> Featured Works
            </h2>
            <div class="creative-projects-grid">
              ${resume.projects.map(proj => `
                <div class="creative-project-card">
                  <div class="proj-card-top">
                    <h3 class="proj-card-title">${escapeHtml(proj.name)}</h3>
                    ${proj.link ? `<a href="${fullUrl(proj.link)}" target="_blank" class="proj-card-link">↗</a>` : ''}
                  </div>
                  ${proj.tech ? `<div class="proj-card-tech">${escapeHtml(proj.tech)}</div>` : ''}
                  <p class="proj-card-desc">${escapeHtml(proj.description)}</p>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        ${(resume.education && resume.education.length) ? `
          <section class="creative-section">
            <h2 class="creative-section-title">
              <span class="creative-num">03</span> Education
            </h2>
            <div class="creative-edu-list">
              ${resume.education.map(edu => `
                <div class="creative-edu-card">
                  <div class="node-header">
                    <div>
                      <h3 class="node-title">${escapeHtml(edu.degree)}</h3>
                      <div class="node-company">${escapeHtml(edu.school)}</div>
                    </div>
                    <span class="node-tag">${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}</span>
                  </div>
                  ${edu.honors ? `<div class="edu-honors">${escapeHtml(edu.honors)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </main>
    </div>
  `;
}

// 4. HARVARD CORPORATE / CLASSIC TEMPLATE
function renderClassicTemplate(resume) {
  const p = resume.personal || {};

  return `
    <div class="resume-sheet classic-template" data-template="classic">
      <header class="classic-header">
        <h1 class="classic-name">${escapeHtml(p.fullName) || 'Your Name'}</h1>
        <div class="classic-title">${escapeHtml(p.title) || 'Professional Title'}</div>
        <div class="classic-contacts">
          ${p.location ? `<span>${escapeHtml(p.location)}</span>` : ''}
          ${p.phone ? `<span>${escapeHtml(p.phone)}</span>` : ''}
          ${p.email ? `<span><a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></span>` : ''}
          ${p.linkedin ? `<span><a href="${fullUrl(p.linkedin)}" target="_blank">${formatUrl(p.linkedin)}</a></span>` : ''}
          ${p.website ? `<span><a href="${fullUrl(p.website)}" target="_blank">${formatUrl(p.website)}</a></span>` : ''}
          ${p.github ? `<span><a href="${fullUrl(p.github)}" target="_blank">${formatUrl(p.github)}</a></span>` : ''}
        </div>
      </header>

      ${p.summary ? `
        <section class="classic-section">
          <h2 class="classic-heading">EXECUTIVE SUMMARY</h2>
          <p class="classic-summary-text">${escapeHtml(p.summary)}</p>
        </section>
      ` : ''}

      ${(resume.experience && resume.experience.length) ? `
        <section class="classic-section">
          <h2 class="classic-heading">PROFESSIONAL EXPERIENCE</h2>
          <div class="classic-exp-list">
            ${resume.experience.map(exp => `
              <div class="classic-exp-item">
                <div class="classic-row-split">
                  <strong class="classic-company">${escapeHtml(exp.company)}</strong>
                  <span class="classic-loc">${escapeHtml(exp.location || '')}</span>
                </div>
                <div class="classic-row-split classic-role-line">
                  <em class="classic-role">${escapeHtml(exp.title)}</em>
                  <span class="classic-date">${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                </div>
                ${exp.bullets && exp.bullets.length ? `
                  <ul class="classic-bullets">
                    ${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${(resume.education && resume.education.length) ? `
        <section class="classic-section">
          <h2 class="classic-heading">EDUCATION</h2>
          <div class="classic-edu-list">
            ${resume.education.map(edu => `
              <div class="classic-edu-item">
                <div class="classic-row-split">
                  <strong class="classic-school">${escapeHtml(edu.school)}</strong>
                  <span class="classic-loc">${escapeHtml(edu.location || '')}</span>
                </div>
                <div class="classic-row-split classic-role-line">
                  <span class="classic-degree">${escapeHtml(edu.degree)}</span>
                  <span class="classic-date">${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}</span>
                </div>
                ${(edu.gpa || edu.honors) ? `
                  <div class="classic-edu-honors">
                    ${edu.gpa ? `GPA: ${escapeHtml(edu.gpa)}. ` : ''}${edu.honors ? escapeHtml(edu.honors) : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${(resume.skills && resume.skills.length) ? `
        <section class="classic-section">
          <h2 class="classic-heading">CORE COMPETENCIES & TECHNICAL SKILLS</h2>
          <div class="classic-skills-block">
            ${resume.skills.map(cat => `
              <div class="classic-skill-line">
                <strong>${escapeHtml(cat.category)}:</strong> ${(cat.items || []).map(s => escapeHtml(s)).join(', ')}
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${(resume.projects && resume.projects.length) ? `
        <section class="classic-section">
          <h2 class="classic-heading">NOTABLE PROJECTS</h2>
          <div class="classic-projects-list">
            ${resume.projects.map(proj => `
              <div class="classic-proj-item">
                <div class="classic-row-split">
                  <strong class="classic-proj-name">${escapeHtml(proj.name)}</strong>
                  ${proj.tech ? `<span class="classic-proj-tech">(${escapeHtml(proj.tech)})</span>` : ''}
                </div>
                <p class="classic-proj-desc">${escapeHtml(proj.description)}</p>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${(resume.certifications && resume.certifications.length) ? `
        <section class="classic-section">
          <h2 class="classic-heading">LICENSES & CERTIFICATIONS</h2>
          <div class="classic-certs-list">
            ${resume.certifications.map(c => `
              <div class="classic-cert-line">
                <strong>${escapeHtml(c.name)}</strong> – ${escapeHtml(c.issuer)} (${escapeHtml(c.date)})
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
    </div>
  `;
}

// Master Render Function
function renderResume(resume) {
  const templateId = resume.settings?.template || 'modern';
  let html = '';
  switch (templateId) {
    case 'tech':
      html = renderTechTemplate(resume);
      break;
    case 'creative':
      html = renderCreativeTemplate(resume);
      break;
    case 'classic':
      html = renderClassicTemplate(resume);
      break;
    case 'modern':
    default:
      html = renderModernTemplate(resume);
      break;
  }
  return html;
}
