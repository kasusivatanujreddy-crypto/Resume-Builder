// Resume Builder - Data Store & Defaults

const DEFAULT_AVATAR = 'assets/avatar.jpg';

const SAMPLE_RESUMES = {
  software_engineer: {
    personal: {
      fullName: 'Sophia Chen',
      title: 'Senior Full-Stack & Cloud Architect',
      email: 'sophia.chen@example.com',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      website: 'https://sophiachen.dev',
      linkedin: 'linkedin.com/in/sophiachen-dev',
      github: 'github.com/sophiachen',
      avatar: DEFAULT_AVATAR,
      showAvatar: true,
      summary: 'High-impact Software Architect with 7+ years of experience designing fault-tolerant distributed systems and modern web applications. Proven track record leading cross-functional engineering teams, accelerating microservices migration, and improving system throughput by 42% for over 12M active users.'
    },
    experience: [
      {
        id: 'exp-1',
        title: 'Lead Distributed Systems Engineer',
        company: 'Stripe Ecosystem',
        location: 'San Francisco, CA',
        startDate: '2022-03',
        endDate: '',
        current: true,
        bullets: [
          'Architected and deployed high-throughput event processing pipelines processing 180M+ daily transactions with 99.999% uptime.',
          'Spearheaded migration of legacy monolith to gRPC-based microservices architecture, cutting end-to-end API latency by 38%.',
          'Accelerated engineering velocity by mentoring a cohort of 14 software engineers across 3 geographic zones, conducting over 120 architecture design reviews.'
        ]
      },
      {
        id: 'exp-2',
        title: 'Senior Full-Stack Engineer',
        company: 'Airbnb Experiences',
        location: 'San Francisco, CA',
        startDate: '2019-06',
        endDate: '2022-02',
        current: false,
        bullets: [
          'Engineered real-time booking collaboration engine using React, TypeScript, and WebSockets, boosting checkout conversions by 18.4%.',
          'Accelerated page load performance by optimizing bundle size and Core Web Vitals, slashing initial Largest Contentful Paint (LCP) from 3.4s to 0.9s.',
          'Spearheaded cross-functional design system initiative with product designers, establishing unified atomic tokens across web and mobile platforms.'
        ]
      },
      {
        id: 'exp-3',
        title: 'Software Engineer',
        company: 'Cloudflare Analytics',
        location: 'Austin, TX',
        startDate: '2017-08',
        endDate: '2019-05',
        current: false,
        bullets: [
          'Architected distributed telemetry dashboards monitoring 40,000+ edge nodes using Go and ClickHouse.',
          'Accelerated deployment lead time from 4 hours to 9 minutes by automating CI/CD release workflows with GitHub Actions and Terraform.'
        ]
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Master of Science in Computer Science',
        school: 'Stanford University',
        location: 'Stanford, CA',
        startDate: '2015',
        endDate: '2017',
        gpa: '3.94 / 4.0',
        honors: 'Specialization in Distributed Systems & AI. Graduate Teaching Fellow.'
      },
      {
        id: 'edu-2',
        degree: 'Bachelor of Science in Computer Engineering',
        school: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        startDate: '2011',
        endDate: '2015',
        gpa: '3.88 / 4.0',
        honors: 'Dean’s Honor List (All Semesters), Eta Kappa Nu Honor Society.'
      }
    ],
    skills: [
      { category: 'Languages & Core', items: ['TypeScript', 'JavaScript (ESNext)', 'Python', 'Go', 'Rust', 'SQL', 'HTML5/CSS3'] },
      { category: 'Frameworks & Libraries', items: ['React 19', 'Next.js', 'Node.js', 'GraphQL', 'Tailwind CSS', 'Redux Toolkit', 'Express'] },
      { category: 'Cloud, DevOps & Data', items: ['AWS (ECS, Lambda, S3)', 'Docker', 'Kubernetes', 'Terraform', 'PostgreSQL', 'Redis', 'Kafka'] },
      { category: 'Architecture & Leadership', items: ['Distributed Systems', 'Microservices', 'System Design', 'Agile/Scrum', 'CI/CD Pipelines'] }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'OmniStream - Real-Time Event Bus',
        role: 'Creator & Lead Maintainer',
        link: 'https://github.com/sophiachen/omnistream',
        tech: 'Go, WebSockets, Redis Streams',
        description: 'Lightweight distributed pub/sub broker handling 250,000 messages/sec with sub-5ms jitter. 4.2k+ GitHub Stars.'
      },
      {
        id: 'proj-2',
        name: 'Nexus UI - Design System Kit',
        role: 'Core Author',
        link: 'https://nexus-ui.dev',
        tech: 'React, TypeScript, CSS Variables, Storybook',
        description: 'Accessible, headless component primitives with 100% test coverage and WCAG AAA compliance adopted by 40+ production teams.'
      }
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect – Professional',
        issuer: 'Amazon Web Services',
        date: '2023',
        credentialId: 'AWS-PSA-893472'
      },
      {
        id: 'cert-2',
        name: 'Certified Kubernetes Administrator (CKA)',
        issuer: 'Cloud Native Computing Foundation',
        date: '2022',
        credentialId: 'CKA-77402'
      }
    ],
    languages: [
      { name: 'English', level: 'Native / Bilingual' },
      { name: 'Mandarin Chinese', level: 'Native / Bilingual' },
      { name: 'Spanish', level: 'Professional Working' }
    ],
    settings: {
      template: 'modern',
      primaryColor: '#2563eb',
      secondaryColor: '#1e293b',
      fontFamily: 'Inter',
      fontSize: 'normal', // 'compact', 'normal', 'relaxed'
      lineHeight: 'normal',
      sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages']
    }
  },

  product_manager: {
    personal: {
      fullName: 'Alexandre Rivera',
      title: 'Principal Product Manager | FinTech & AI',
      email: 'a.rivera@productvision.io',
      phone: '+1 (415) 890-1234',
      location: 'New York, NY',
      website: 'https://alexrivera.pm',
      linkedin: 'linkedin.com/in/alex-rivera-pm',
      github: '',
      avatar: DEFAULT_AVATAR,
      showAvatar: false,
      summary: 'Data-driven Principal Product Manager with 8+ years scaling consumer FinTech and automated AI workflows. Track record owning $45M ARR P&L, launching zero-to-one mobile apps, and boosting 30-day retention by 28% through iterative experimentation and customer empathy.'
    },
    experience: [
      {
        id: 'exp-1',
        title: 'Principal Product Manager',
        company: 'Brex Capital',
        location: 'New York, NY',
        startDate: '2021-04',
        endDate: '',
        current: true,
        bullets: [
          'Spearheaded the 0-to-1 launch of AI Expense Auto-Categorization, saving enterprise customers 14,000+ monthly manual audit hours.',
          'Architected end-to-end product roadmap and discovery for financial analytics tier, driving $16M in new annual recurring revenue.',
          'Accelerated cross-functional delivery across 4 agile sprint squads to sustain 99.4% on-time milestone execution.'
        ]
      },
      {
        id: 'exp-2',
        title: 'Senior Product Manager',
        company: 'Robinhood Financial',
        location: 'Menlo Park, CA',
        startDate: '2018-02',
        endDate: '2021-03',
        current: false,
        bullets: [
          'Spearheaded overhaul of portfolio rebalancing onboarding journey, driving a 22% increase in deposit conversion within 60 days.',
          'Accelerated customer acquisition velocity by executing 45+ rigorous A/B experiments across 8M monthly active users, optimizing CAC by 19%.'
        ]
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Master of Business Administration (MBA)',
        school: 'Columbia Business School',
        location: 'New York, NY',
        startDate: '2016',
        endDate: '2018',
        gpa: '3.91 / 4.0',
        honors: 'Dean’s Honor with Distinction, FinTech Venture Fellow'
      },
      {
        id: 'edu-2',
        degree: 'BS in Economics & Statistics',
        school: 'New York University (Stern)',
        location: 'New York, NY',
        startDate: '2012',
        endDate: '2016',
        gpa: '3.85 / 4.0',
        honors: 'Summa Cum Laude'
      }
    ],
    skills: [
      { category: 'Product Leadership', items: ['Product Strategy', '0-to-1 Product Launch', 'Roadmap Planning', 'OKRs & KPIs', 'P&L Ownership'] },
      { category: 'Analytics & Tech', items: ['SQL', 'Mixpanel', 'Amplitude', 'Looker', 'Python (Pandas)', 'Figma', 'Jira / Linear'] },
      { category: 'Customer & Growth', items: ['A/B Testing', 'User Research', 'GTM Strategy', 'Funnel Optimization', 'Pricing & Packaging'] }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'FinFlow AI Assistant',
        role: 'Product Lead',
        link: 'https://finflow.ai',
        tech: 'LLMs, Prompt Engineering, Mixpanel',
        description: 'Conversational financial health tool with over 150k monthly queries and 4.9/5 star user satisfaction.'
      }
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'Pragmatic Certified Product Manager (PMC-III)',
        issuer: 'Pragmatic Institute',
        date: '2020',
        credentialId: 'PRAG-9801'
      }
    ],
    languages: [
      { name: 'English', level: 'Native' },
      { name: 'Spanish', level: 'Native' },
      { name: 'French', level: 'Conversational' }
    ],
    settings: {
      template: 'tech',
      primaryColor: '#0f766e',
      secondaryColor: '#1e293b',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 'normal',
      lineHeight: 'normal',
      sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages']
    }
  },

  creative_designer: {
    personal: {
      fullName: 'Marcus Vance',
      title: 'Senior Brand & Product UI/UX Designer',
      email: 'marcus@vancestudio.design',
      phone: '+1 (312) 456-7890',
      location: 'Chicago, IL',
      website: 'https://marcusvance.design',
      linkedin: 'linkedin.com/in/marcusvance-ui',
      github: 'dribbble.com/marcusvance',
      avatar: DEFAULT_AVATAR,
      showAvatar: true,
      summary: 'Award-winning Product and Brand Designer with 6+ years creating intuitive human-centered design systems, mobile apps, and spatial computing experiences. Passionate about micro-interactions, motion design, and accessible interfaces that delight users.'
    },
    experience: [
      {
        id: 'exp-1',
        title: 'Lead Design Systems Specialist',
        company: 'Verve Interactive Studios',
        location: 'Chicago, IL',
        startDate: '2021-08',
        endDate: '',
        current: true,
        bullets: [
          'Architected unified multi-brand design system with 240+ components, accelerating sprint delivery velocity by 35% across 6 client teams.',
          'Spearheaded comprehensive redesign of flagship e-commerce mobile application, resulting in a 41% uplift in average basket value and 4.9 App Store rating.',
          'Accelerated team alignment by orchestrating bi-weekly design critique workshops, standardizing accessibility and ergonomic design guidelines.'
        ]
      },
      {
        id: 'exp-2',
        title: 'Product Designer',
        company: 'Figma Agency Partner',
        location: 'San Francisco, CA',
        startDate: '2019-01',
        endDate: '2021-07',
        current: false,
        bullets: [
          'Architected and prototyped high-fidelity micro-interactions and vector design assets for Fortune 500 SaaS applications.',
          'Accelerated checkout conversion by conducting qualitative usability research with 60+ participants, identifying key friction points and trimming drop-off by 26%.'
        ]
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Bachelor of Fine Arts in Interaction & Graphic Design',
        school: 'Rhode Island School of Design (RISD)',
        location: 'Providence, RI',
        startDate: '2015',
        endDate: '2019',
        gpa: '3.92 / 4.0',
        honors: 'Presidential Scholar, Design Excellence Gold Medal'
      }
    ],
    skills: [
      { category: 'Design Craft', items: ['Design Systems', 'UI/UX Prototyping', 'Design Tokens', 'Wireframing', 'Motion Design', 'Typography'] },
      { category: 'Tools & Code', items: ['Figma (Variables/AutoLayout)', 'Framer', 'Principle', 'Adobe After Effects', 'HTML5/CSS3', 'Webflow'] },
      { category: 'Research & Strategy', items: ['User Testing', 'Heuristic Evaluation', 'Information Architecture', 'Design Thinking'] }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Prism Motion Design Guidelines',
        role: 'Sole Creator',
        link: 'https://prism-motion.io',
        tech: 'Figma, After Effects, Lottie',
        description: 'Open-source motion and spring physics specification for mobile gestures. Featured on Awwwards & SiteInspire.'
      }
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'Nielsen Norman Group UX Master Certified',
        issuer: 'NN/g',
        date: '2021',
        credentialId: 'NNG-UXM-4412'
      }
    ],
    languages: [
      { name: 'English', level: 'Native' },
      { name: 'French', level: 'Fluent' }
    ],
    settings: {
      template: 'creative',
      primaryColor: '#7c3aed',
      secondaryColor: '#18181b',
      fontFamily: 'Outfit',
      fontSize: 'normal',
      lineHeight: 'normal',
      sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages']
    }
  }
};

const COLOR_PALETTES = [
  { id: 'indigo', name: 'Electric Indigo', primary: '#4f46e5', secondary: '#1e1b4b' },
  { id: 'blue', name: 'Royal Sapphire', primary: '#2563eb', secondary: '#0f172a' },
  { id: 'teal', name: 'Emerald Slate', primary: '#0f766e', secondary: '#134e4a' },
  { id: 'violet', name: 'Amethyst Luxe', primary: '#7c3aed', secondary: '#3b0764' },
  { id: 'crimson', name: 'Ruby Crimson', primary: '#e11d48', secondary: '#4c0519' },
  { id: 'amber', name: 'Warm Amber', primary: '#d97706', secondary: '#451a03' },
  { id: 'obsidian', name: 'Modern Obsidian', primary: '#18181b', secondary: '#27272a' },
  { id: 'cyan', name: 'Nordic Cyan', primary: '#0284c7', secondary: '#082f49' }
];

const FONTS = [
  { id: 'Inter', name: 'Inter (Modern Sans)', family: "'Inter', sans-serif" },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Crisp Tech)', family: "'Plus Jakarta Sans', sans-serif" },
  { id: 'Outfit', name: 'Outfit (Clean Geometric)', family: "'Outfit', sans-serif" },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech Minimal)', family: "'Space Grotesk', sans-serif" },
  { id: 'Merriweather', name: 'Merriweather (Classic Editorial)', family: "'Merriweather', serif" },
  { id: 'Roboto Slab', name: 'Roboto Slab (Executive Hybrid)', family: "'Roboto Slab', serif" }
];

const TEMPLATES = [
  { id: 'modern', name: 'Modern Executive', tag: 'Two-column, header banner, high visual impact' },
  { id: 'tech', name: 'Silicon Valley', tag: 'Single column, dense tech badges, high ATS score' },
  { id: 'creative', name: 'Creative Studio', tag: 'Sidebar accent, visual timeline, modern typography' },
  { id: 'classic', name: 'Harvard Corporate', tag: 'Timeless formal layout, serif elegance, finance/law ready' }
];

const ACTION_VERBS = {
  leadership: ['Spearheaded', 'Architected', 'Accelerated', 'Orchestrated', 'Pioneered', 'Steered', 'Empowered', 'Mobilized', 'Governed', 'Directed', 'Championed'],
  development: ['Architected', 'Engineered', 'Accelerated', 'Implemented', 'Constructed', 'Refactored', 'Deployed', 'Automated', 'Scaled', 'Synthesized', 'Programmed'],
  optimization: ['Accelerated', 'Spearheaded', 'Architected', 'Enhanced', 'Maximized', 'Streamlined', 'Trimmed', 'Boosted', 'Elevated', 'Restructured', 'Standardized', 'Slashed'],
  collaboration: ['Orchestrated', 'Spearheaded', 'Partnered', 'Coordinated', 'Facilitated', 'Liaised', 'Fostered', 'Negotiated', 'Advocated', 'Synchronized', 'Mentored'],
  innovation: ['Pioneered', 'Architected', 'Spearheaded', 'Conceptualized', 'Devised', 'Discovered', 'Designed', 'Instituted', 'Formulated', 'Modernized', 'Revolutionized']
};

const BULLET_TEMPLATES = [
  "Spearheaded [initiative/feature], resulting in a [X%] improvement in [key metric] within [timeframe].",
  "Architected and deployed [system/solution] handling [volume/load] with [uptime/reliability metric].",
  "Accelerated [process/workflow], slashing [latency/cost/time] by [X%] across [team/organization].",
  "Spearheaded cross-functional team of [X] engineers and designers to launch [product/project] on schedule.",
  "Architected automated [tool/workflow], cutting [operational cost/error rate] by [X%]."
];

// Calculate ATS and Quality Score
function calculateResumeScore(resume) {
  let score = 0;
  const tips = [];
  const checks = [];

  // 1. Personal Information Completeness (20 pts)
  let contactPts = 0;
  if (resume.personal.fullName && resume.personal.fullName.trim().length > 2) contactPts += 5;
  if (resume.personal.title && resume.personal.title.trim().length > 3) contactPts += 5;
  if (resume.personal.email && resume.personal.email.includes('@')) contactPts += 4;
  if (resume.personal.phone && resume.personal.phone.length > 5) contactPts += 3;
  if (resume.personal.location && resume.personal.location.length > 2) contactPts += 3;
  score += contactPts;

  if (contactPts === 20) {
    checks.push({ text: 'Complete contact & header info', passed: true });
  } else {
    tips.push('Fill in your full contact details (email, phone, location, job title).');
  }

  // 2. Summary Quality (15 pts)
  const summaryWords = (resume.personal.summary || '').trim().split(/\s+/).filter(Boolean).length;
  if (summaryWords >= 25 && summaryWords <= 80) {
    score += 15;
    checks.push({ text: `Concise professional summary (${summaryWords} words)`, passed: true });
  } else if (summaryWords > 0) {
    score += 8;
    tips.push(`Summary is ${summaryWords} words. Ideal length is 30–60 punchy words.`);
  } else {
    tips.push('Add a compelling professional summary (3-4 impactful sentences).');
  }

  // 3. Work Experience & Quantifiable Achievements (30 pts)
  if (resume.experience && resume.experience.length >= 2) {
    score += 10;
    checks.push({ text: `${resume.experience.length} work experience entries`, passed: true });
  } else if (resume.experience && resume.experience.length === 1) {
    score += 5;
    tips.push('Add at least 2 relevant work experience roles if applicable.');
  } else {
    tips.push('Add your work history with actionable bullet points.');
  }

  // Action verbs and metrics check in experience
  let totalBullets = 0;
  let metricsCount = 0;
  let actionVerbCount = 0;
  const metricRegex = /\b(\d+([.,]\d+)?%?|\$\d+([.,]\d+)?|\b\d+x\b|\b\d+\b)\b/i;
  
  const allVerbs = Object.values(ACTION_VERBS).flat().map(v => v.toLowerCase());

  (resume.experience || []).forEach(exp => {
    (exp.bullets || []).forEach(bullet => {
      totalBullets++;
      if (metricRegex.test(bullet)) metricsCount++;
      const cleanBullet = bullet.trim().replace(/^["'“‘•\-\*\s]+/, '');
      const firstWord = cleanBullet.split(/\s+/)[0]?.toLowerCase().replace(/[^\w]/g, '');
      if (firstWord && (
        allVerbs.some(v => firstWord === v || firstWord.startsWith(v.slice(0, 4)) || v.startsWith(firstWord.slice(0, 4))) ||
        ['spearheaded', 'architected', 'accelerated', 'engineered', 'orchestrated', 'pioneered', 'steered', 'streamlined', 'maximized', 'automated', 'championed', 'transformed', 'modernized', 'overhauled', 'boosted', 'slashed', 'trimmed', 'elevated'].includes(firstWord)
      )) {
        actionVerbCount++;
      }
    });
  });

  if (totalBullets >= 4) {
    score += 5;
  }
  if (metricsCount >= 2) {
    score += 8;
    checks.push({ text: `Strong measurable metrics found (${metricsCount} data points)`, passed: true });
  } else {
    tips.push('Include measurable metrics (e.g. "increased by 25%", "$12M ARR", "180k users").');
  }

  if (actionVerbCount >= 3) {
    score += 7;
    checks.push({ text: `Impactful action verbs used (${actionVerbCount} detected)`, passed: true });
  } else {
    tips.push('Begin bullets with strong action verbs (Spearheaded, Architected, Accelerated).');
  }

  // 4. Skills Section (15 pts)
  let totalSkills = 0;
  (resume.skills || []).forEach(cat => {
    totalSkills += (cat.items || []).length;
  });

  if (totalSkills >= 8 && totalSkills <= 30) {
    score += 15;
    checks.push({ text: `Balanced skill list (${totalSkills} keywords)`, passed: true });
  } else if (totalSkills > 0) {
    score += 8;
    tips.push(`You have ${totalSkills} skills. Aim for 10-20 relevant keywords for ATS parsing.`);
  } else {
    tips.push('Add technical and domain skills to optimize for keyword matching.');
  }

  // 5. Education & Credentials (10 pts)
  if (resume.education && resume.education.length >= 1) {
    score += 10;
    checks.push({ text: 'Education credentials listed', passed: true });
  } else {
    tips.push('Include your highest educational qualifications.');
  }

  // 6. Projects or Certifications (10 pts)
  const hasProjects = resume.projects && resume.projects.length > 0;
  const hasCerts = resume.certifications && resume.certifications.length > 0;
  if (hasProjects || hasCerts) {
    score += 10;
    checks.push({ text: 'Notable projects or certifications included', passed: true });
  } else {
    tips.push('Add standout projects or industry certifications to stand out.');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    checks,
    tips
  };
}
