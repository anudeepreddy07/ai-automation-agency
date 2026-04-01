import { useEffect, useState } from 'react';
import './index.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

function App() {
  const [email, setEmail] = useState('');
  const [auditStatus, setAuditStatus] = useState('');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('email');
  const [authEmail, setAuthEmail] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [deploymentState, setDeploymentState] = useState('idle');
  const [deploymentLogs, setDeploymentLogs] = useState([]);

  const handleStartTrial = (e) => {
    e.preventDefault();
    setShowAuthModal(true);
    setAuthStep('email');
    setAuthError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      if (data.success) {
        setAuthStep('otp');
      } else {
        setAuthError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setAuthError('Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, otp: authOtp })
      });
      const data = await res.json();
      if (data.success) {
        setShowAuthModal(false);
        simulateDeployment();
      } else {
        setAuthError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setAuthError('Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const simulateDeployment = () => {
    setDeploymentState('deploying');
    setDeploymentLogs([]);
    const sequence = [
      "Initializing secure environment...",
      "Provisioning cloud resources...",
      "Installing AI Agent modules...",
      "Connecting API webhooks...",
      "Running final diagnostics...",
      "Status: LIVE and Online."
    ];
    let step = 0;
    
    const interval = setInterval(() => {
      setDeploymentLogs(prev => [...prev, sequence[step]]);
      step++;
      if (step >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => setDeploymentState('success'), 1200);
      }
    }, 1200);
  };
  const handleCheckout = async (e, plan, price) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, price })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message + "\nRedirecting to: " + data.checkoutUrl);
      }
    } catch (err) {
      console.error("Backend connection error:", err);
      alert("Checkout failed. Is the backend running?");
    }
  };

  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    setAuditStatus('Sending...');
    try {
      const res = await fetch(`${BACKEND_URL}/audit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setAuditStatus('Request Received!');
        setEmail('');
      } else {
        setAuditStatus('Error submitting request.');
      }
    } catch (err) {
      console.error("Backend connection error:", err);
      setAuditStatus('Connection Error.');
    }
  };

  useEffect(() => {
    // Custom cursor
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    let mx = 0, my = 0, rx = 0, ry = 0;
    let animationFrameId;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursor) {
        cursor.style.left = mx + 'px';
        cursor.style.top = my + 'px';
      }
    };

    document.addEventListener('mousemove', onMouseMove);

    function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring) {
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
      }
      animationFrameId = requestAnimationFrame(animRing);
    }
    animRing();

    // Hover states
    const interactables = document.querySelectorAll('a, button, .service-card, .step, .pricing-card');
    const onEnter = () => {
      if (cursor && ring) {
        cursor.style.width = '18px';
        cursor.style.height = '18px';
        ring.style.width = '52px';
        ring.style.height = '52px';
      }
    };
    const onLeave = () => {
      if (cursor && ring) {
        cursor.style.width = '10px';
        cursor.style.height = '10px';
        ring.style.width = '36px';
        ring.style.height = '36px';
      }
    };

    interactables.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    // Scroll reveal observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // Stat observer
    const statsObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const nums = entry.target.querySelectorAll('.stat-num');
          nums.forEach(n => {
            const text = n.textContent;
            const match = text.match(/[\d.]+/);
            if (match) {
              const num = parseFloat(match[0]);
              const suffix = text.replace(match[0], '');
              animateCount(n, num, suffix);
            }
          });
          statsObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    const statsContainer = document.querySelector('.hero-stats');
    if (statsContainer) statsObs.observe(statsContainer);
    
    // Counter animation
    function animateCount(el, target, suffix='') {
      let start = 0;
      const duration = 2000;
      const step = timestamp => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    // Universal Click Tracking
    const onDocumentClick = async (e) => {
      try {
        const elementTag = e.target.tagName?.toLowerCase() || 'unknown';
        const elementClass = typeof e.target.className === 'string' ? e.target.className : '';
        const text = e.target.innerText ? e.target.innerText.split('\n')[0].slice(0, 30) : '';
        
        await fetch(`${BACKEND_URL}/track-click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            element: `${elementTag}${elementClass ? '.' + elementClass.replace(/\s+/g, '.') : ''}`,
            text: text,
            timestamp: new Date().toISOString()
          })
        });
      } catch (err) {
        // Soft fail if tracking backend is down
      }
    };
    document.addEventListener('click', onDocumentClick);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onDocumentClick);
      interactables.forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      statsObs.disconnect();
    };
  }, []);

  return (
    <>
      <div className="cursor" id="cursor"></div>
      <div className="cursor-ring" id="cursorRing"></div>

      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content fade-up visible">
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            <h2 className="modal-title">Start Free Trial</h2>
            <p className="modal-desc">
              {authStep === 'email' ? 'Enter your email to get started for free.' : 'Enter the 6-digit OTP sent to your email (check console).'}
            </p>
            {authError && <div className="modal-error">{authError}</div>}
            
            {authStep === 'email' ? (
              <form onSubmit={handleSendOtp} className="modal-form">
                <input type="email" required placeholder="name@company.com" className="cta-input" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                <button type="submit" className="cta-submit" style={{ width: '100%' }} disabled={authLoading}>
                  {authLoading ? 'Sending...' : 'Get OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="modal-form">
                <input type="text" required placeholder="123456" className="cta-input" style={{ letterSpacing: '8px', textAlign: 'center' }} value={authOtp} onChange={(e) => setAuthOtp(e.target.value)} maxLength={6} />
                <button type="submit" className="cta-submit" style={{ width: '100%' }} disabled={authLoading}>
                  {authLoading ? 'Verifying...' : 'Deploy Now'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {deploymentState !== 'idle' && (
        <div className="modal-overlay deployment-overlay">
          <div className="terminal-body fade-up visible" style={{ width: '600px', maxWidth: '90%', margin: '0 auto', textAlign: 'left' }}>
             <div className="terminal-bar">
              <span className="terminal-title">nexus-deploy · initializing</span>
            </div>
            {deploymentLogs.map((log, i) => (
              <span key={i} className="t-line t-output">→ {log}</span>
            ))}
            {deploymentState === 'deploying' && (
              <span className="t-line"><span className="t-cursor"></span></span>
            )}
            {deploymentState === 'success' && (
              <div style={{ marginTop: '20px' }}>
                <span className="t-line t-success">✓ Deployment Successful</span>
                <span className="t-line"></span>
                <button className="pricing-btn" style={{ background: 'var(--accent)', color: '#000', marginTop: '20px' }} onClick={() => setDeploymentState('idle')}>Enter Dashboard</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav>
        <a href="#" className="nav-logo">NEX<span>US</span></a>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#process">Process</a></li>
          <li><a href="#results">Results</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <button className="nav-cta" onClick={() => document.getElementById('contact').scrollIntoView()}>Get Audit</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-orb"></div>
        <div className="hero-orb2"></div>

        <div className="hero-badge">AI Automation Agency · Est. 2024</div>

        <h1 className="hero-headline">
          We Build<br />
          <em>Intelligent</em><br />
          <span className="line2">Machines</span><br />
          <span className="line3">For Your Business</span>
        </h1>

        <div className="hero-bottom">
          <p className="hero-desc">
            <strong>NEXUS automates what slows you down.</strong> From AI agents to full workflow automation — we replace repetitive work with systems that run 24/7, learn, and scale.
          </p>
          <div className="hero-actions">
            <a href="#pricing" className="btn-primary">Start Automating</a>
            <a href="#process" className="btn-ghost">See How It Works</a>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">340<span>+</span></div>
            <div className="stat-label">Workflows Deployed</div>
          </div>
          <div className="stat">
            <div className="stat-num">12<span>M</span></div>
            <div className="stat-label">Hours Saved</div>
          </div>
          <div className="stat">
            <div className="stat-num">98<span>%</span></div>
            <div className="stat-label">Client Retention</div>
          </div>
          <div className="stat">
            <div className="stat-num">4.2<span>x</span></div>
            <div className="stat-label">Avg ROI</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          <span className="marquee-item">AI Agents <span className="marquee-dot"></span></span>
          <span className="marquee-item">Workflow Automation <span className="marquee-dot"></span></span>
          <span className="marquee-item">LLM Integration <span className="marquee-dot"></span></span>
          <span className="marquee-item">Data Pipelines <span className="marquee-dot"></span></span>
          <span className="marquee-item">CRM Automation <span className="marquee-dot"></span></span>
          <span className="marquee-item">AI Chatbots <span className="marquee-dot"></span></span>
          <span className="marquee-item">Process Mining <span className="marquee-dot"></span></span>
          <span className="marquee-item">Voice AI <span className="marquee-dot"></span></span>
          <span className="marquee-item">AI Agents <span className="marquee-dot"></span></span>
          <span className="marquee-item">Workflow Automation <span className="marquee-dot"></span></span>
          <span className="marquee-item">LLM Integration <span className="marquee-dot"></span></span>
          <span className="marquee-item">Data Pipelines <span className="marquee-dot"></span></span>
          <span className="marquee-item">CRM Automation <span className="marquee-dot"></span></span>
          <span className="marquee-item">AI Chatbots <span className="marquee-dot"></span></span>
          <span className="marquee-item">Process Mining <span className="marquee-dot"></span></span>
          <span className="marquee-item">Voice AI <span className="marquee-dot"></span></span>
        </div>
      </div>

      {/* SERVICES */}
      <section id="services">
        <div className="section-label">What We Do</div>
        <h2 className="section-title">Our <em>Core</em><br />Services</h2>
        <div className="services-grid">
          <div className="service-card fade-up">
            <div className="service-num">01 / 06</div>
            <div className="service-icon">🤖</div>
            <div className="service-name">AI Agents</div>
            <p className="service-desc">Autonomous agents that reason, plan, and execute complex multi-step tasks across your tools — with zero manual intervention.</p>
            <div className="service-tags">
              <span className="tag">LangChain</span>
              <span className="tag">OpenAI</span>
              <span className="tag">Claude</span>
              <span className="tag">AutoGPT</span>
            </div>
          </div>
          <div className="service-card fade-up">
            <div className="service-num">02 / 06</div>
            <div className="service-icon">⚡</div>
            <div className="service-name">Workflow Automation</div>
            <p className="service-desc">End-to-end automation of business processes — from lead capture to invoicing. We map, design, and deploy your ops on autopilot.</p>
            <div className="service-tags">
              <span className="tag">Make</span>
              <span className="tag">n8n</span>
              <span className="tag">Zapier</span>
              <span className="tag">Custom</span>
            </div>
          </div>
          <div className="service-card fade-up">
            <div className="service-num">03 / 06</div>
            <div className="service-icon">💬</div>
            <div className="service-name">AI Chatbots</div>
            <p className="service-desc">Custom LLM-powered chatbots trained on your data. Support 10x more customers, 24/7, with human-level accuracy.</p>
            <div className="service-tags">
              <span className="tag">RAG</span>
              <span className="tag">Fine-tuning</span>
              <span className="tag">Multi-channel</span>
            </div>
          </div>
          <div className="service-card fade-up">
            <div className="service-num">04 / 06</div>
            <div className="service-icon">📊</div>
            <div className="service-name">Data Pipelines</div>
            <p className="service-desc">Transform raw data into intelligence. Automated ETL, real-time dashboards, and AI-powered reporting that runs itself.</p>
            <div className="service-tags">
              <span className="tag">dbt</span>
              <span className="tag">Airflow</span>
              <span className="tag">BigQuery</span>
            </div>
          </div>
          <div className="service-card fade-up">
            <div className="service-num">05 / 06</div>
            <div className="service-icon">📞</div>
            <div className="service-name">Voice AI</div>
            <p className="service-desc">Deploy AI voice agents for inbound calls, outbound campaigns, and customer interviews — indistinguishable from human reps.</p>
            <div className="service-tags">
              <span className="tag">ElevenLabs</span>
              <span className="tag">Twilio</span>
              <span className="tag">Vapi</span>
            </div>
          </div>
          <div className="service-card fade-up">
            <div className="service-num">06 / 06</div>
            <div className="service-icon">🔗</div>
            <div className="service-name">CRM Automation</div>
            <p className="service-desc">AI that updates your CRM, scores leads, sends follow-ups, and books meetings — so your sales team only closes deals.</p>
            <div className="service-tags">
              <span className="tag">HubSpot</span>
              <span className="tag">Salesforce</span>
              <span className="tag">Pipedrive</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="process-section">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">From<br /><em>Audit</em> to<br />Autopilot</h2>
        <div className="process-grid">
          <div className="process-steps">
            <div className="step fade-up">
              <div className="step-num">01</div>
              <div className="step-content">
                <div className="step-title">Discovery Audit</div>
                <p className="step-text">We analyze your ops, identify high-ROI automation targets, and map your existing tools and workflows.</p>
              </div>
            </div>
            <div className="step fade-up">
              <div className="step-num">02</div>
              <div className="step-content">
                <div className="step-title">System Design</div>
                <p className="step-text">Our engineers blueprint the AI architecture — agents, triggers, data flows, integrations — tailored to your stack.</p>
              </div>
            </div>
            <div className="step fade-up">
              <div className="step-num">03</div>
              <div className="step-content">
                <div className="step-title">Build & Test</div>
                <p className="step-text">We build in sprints with real feedback loops. Every automation is stress-tested before it touches your live environment.</p>
              </div>
            </div>
            <div className="step fade-up">
              <div className="step-num">04</div>
              <div className="step-content">
                <div className="step-title">Deploy & Optimize</div>
                <p className="step-text">Launch with confidence. We monitor, iterate, and continuously improve — your automations get smarter over time.</p>
              </div>
            </div>
          </div>

          <div className="terminal fade-up">
            <div className="terminal-bar">
              <div className="terminal-dot"></div>
              <div className="terminal-dot"></div>
              <div className="terminal-dot"></div>
              <span className="terminal-title">nexus-agent · audit-pipeline</span>
            </div>
            <div className="terminal-body">
              <span className="t-line"><span className="t-prompt">nexus@agent:~$</span> <span className="t-cmd">run audit --client=acme-corp</span></span>
              <span className="t-line t-output">→ Scanning 47 workflows...</span>
              <span className="t-line t-output">→ Analyzing CRM data patterns...</span>
              <span className="t-line t-output">→ Identifying bottlenecks...</span>
              <span className="t-line"> </span>
              <span className="t-line t-success">✓ 12 automation targets found</span>
              <span className="t-line t-success">✓ Est. 840 hrs/month savings</span>
              <span className="t-line t-success">✓ ROI projection: 6.2x</span>
              <span className="t-line"> </span>
              <span className="t-line"><span className="t-prompt">nexus@agent:~$</span> <span className="t-cmd">deploy --priority=high</span></span>
              <span className="t-line t-output">→ Spinning up AI agents...</span>
              <span className="t-line t-output">→ Connecting integrations...</span>
              <span className="t-line t-success">✓ Pipeline live · 3 agents running</span>
              <span className="t-line"> </span>
              <span className="t-line"><span className="t-prompt">nexus@agent:~$</span> <span className="t-cursor"></span></span>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section id="results">
        <div className="section-label">Proven Impact</div>
        <h2 className="section-title">The <em>Numbers</em><br />Don't Lie</h2>
        <div className="results-grid fade-up">
          <div className="result-card">
            <div className="result-num accent">87%</div>
            <div className="result-label">Avg Time Reduction in Ops</div>
          </div>
          <div className="result-card">
            <div className="result-num blue">12M+</div>
            <div className="result-label">Hours Automated to Date</div>
          </div>
          <div className="result-card">
            <div className="result-num orange">4.2x</div>
            <div className="result-label">Average Client ROI</div>
          </div>
          <div className="result-card">
            <div className="result-num" style={{ color: 'var(--text)' }}>340+</div>
            <div className="result-label">Active Automations</div>
          </div>
        </div>

        {/* TESTIMONIALS */}
        <div className="testimonials-grid">
          <div className="testimonial-card fade-up">
            <p className="testimonial-text">NEXUS replaced 3 full-time ops roles with a single AI agent. Our processing time dropped from 4 days to 20 minutes.</p>
            <div className="testimonial-author">
              <div className="author-avatar">RK</div>
              <div>
                <div className="author-name">Rohan Kapoor</div>
                <div className="author-role">COO · Fintech Startup</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card fade-up">
            <p className="testimonial-text">The voice AI they built handles 600 inbound calls a day. Our human team now focuses only on enterprise clients. Game changer.</p>
            <div className="testimonial-author">
              <div className="author-avatar">SL</div>
              <div>
                <div className="author-name">Sarah Liu</div>
                <div className="author-role">Head of CX · SaaS Co.</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card fade-up">
            <p className="testimonial-text">Within 6 weeks we had a fully autonomous outbound machine. 3x more pipeline, same headcount. The ROI is genuinely insane.</p>
            <div className="testimonial-author">
              <div className="author-avatar">AV</div>
              <div>
                <div className="author-name">Arjun Verma</div>
                <div className="author-role">Founder · D2C Brand</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: 'var(--faint)', borderTop: '1px solid var(--border)' }}>
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple,<br /><em>Transparent</em><br />Plans</h2>
        <div className="pricing-grid">
          <div className="pricing-card fade-up">
            <div className="pricing-plan">Basic</div>
            <div className="pricing-price"><sup>₹</sup>50</div>
            <div className="pricing-period">/ month</div>
            <div className="pricing-divider"></div>
            <ul className="pricing-features">
              <li>2 Automation Workflows</li>
              <li>1 AI Chatbot</li>
              <li>Basic Integrations (3)</li>
              <li>Monthly Reporting</li>
              <li>Email Support</li>
              <li className="muted">AI Agents</li>
              <li className="muted">Voice AI</li>
              <li className="muted">Dedicated Engineer</li>
            </ul>
            <a href="#" className="pricing-btn" onClick={handleStartTrial}>Start Free Trial</a>
          </div>

          <div className="pricing-card featured fade-up">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-plan">Medium</div>
            <div className="pricing-price"><sup>₹</sup>499</div>
            <div className="pricing-period">/ month</div>
            <div className="pricing-divider"></div>
            <ul className="pricing-features">
              <li>10 Automation Workflows</li>
              <li>3 AI Agents</li>
              <li>Advanced Integrations (10)</li>
              <li>AI Chatbot (trained)</li>
              <li>Weekly Reporting + Dashboard</li>
              <li>Slack Support</li>
              <li>Voice AI (1 campaign)</li>
              <li className="muted">Dedicated Engineer</li>
            </ul>
            <a href="#contact" className="pricing-btn" onClick={(e) => handleCheckout(e, 'Medium', 499)}>Get Started</a>
          </div>

          <div className="pricing-card fade-up">
            <div className="pricing-plan">Ultra</div>
            <div className="pricing-price"><sup>₹</sup>1,999</div>
            <div className="pricing-period">/ month</div>
            <div className="pricing-divider"></div>
            <ul className="pricing-features">
              <li>Unlimited Workflows</li>
              <li>Full AI Agent Suite</li>
              <li>Unlimited Integrations</li>
              <li>Voice AI (multi-campaign)</li>
              <li>Real-time Dashboard</li>
              <li>Dedicated Engineer</li>
              <li>Weekly Strategy Calls</li>
              <li>Priority SLA + Uptime</li>
            </ul>
            <a href="#contact" className="pricing-btn" onClick={(e) => handleCheckout(e, 'Ultra', 1999)}>Book a Call</a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="cta-section">
        <div className="cta-bg"></div>
        <div className="section-label" style={{ justifyContent: 'center' }}>Free Audit</div>
        <h2 className="cta-title">Ready to<br /><em>Automate?</em></h2>
        <p className="cta-sub">Get a free 30-min audit. We'll identify your top 3 automation opportunities and estimate your potential ROI — no strings attached.</p>
        <form className="cta-form" onSubmit={handleAuditSubmit}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="cta-input" placeholder="your@company.com" />
          <button type="submit" className="cta-submit">{auditStatus || 'Get Free Audit →'}</button>
        </form>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">NEX<span>US</span></div>
        <ul className="footer-links">
          <li><a href="#">Services</a></li>
          <li><a href="#">Case Studies</a></li>
          <li><a href="#">Process</a></li>
          <li><a href="#">Pricing</a></li>
          <li><a href="/privacy.html">Privacy Policy</a></li>
          <li><a href="/terms.html">Terms of Service</a></li>
        </ul>
        <div className="footer-copy">© 2026 NEXUS · All rights reserved</div>
      </footer>
    </>
  );
}

export default App;
