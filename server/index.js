const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const { initDB, appendRow } = require('./excel_db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// helmet automatically injects secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabling strict CSP to ensure frontend dynamic scripts still load smoothly right now
}));

app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json()); // Parse JSON bodies

// Rate limiting (Protect against DDoS/Brute Force)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, // Strict 5 requests per 15 minutes for OTPs
  message: { success: false, error: 'Too many OTP requests from this IP. Please try again later.' }
});

// Input Validation Regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory OTP store (use Redis in prod)
const otpStore = new Map();

// Initialize Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Endpoints

// 1. Generic click tracking route
app.post('/api/track-click', async (req, res) => {
  const { element, text, timestamp } = req.body;
  console.log(`[TRACK] User clicked: "${text}" on element <${element}> at ${timestamp}`);
  
  try {
    await appendRow('Clicks', {
      date: new Date().toISOString(),
      element: element || 'unknown',
      text: text || 'N/A',
      timestamp: timestamp || 'N/A'
    });
  } catch (err) {
    console.error('Failed to log click to Excel:', err);
  }

  res.status(200).json({ success: true, message: 'Click tracked' });
});

// 2. Audit form request route
app.post('/api/audit-request', async (req, res) => {
  const { email } = req.body;
  if (!email || !emailRegex.test(email)) {
    console.log(`[AUDIT] Failed request - invalid email format.`);
    return res.status(400).json({ success: false, error: 'A valid email is required' });
  }
  console.log(`[AUDIT] Received free audit request for email: ${email}`);
  
  try {
    await appendRow('Audits', {
      date: new Date().toISOString(),
      email: email,
      status: 'Pending'
    });
  } catch (err) {
    console.error('Failed to log audit to Excel:', err);
  }

  // In a real scenario, this would trigger an email or save to a database.
  res.status(200).json({ success: true, message: `Audit request received for ${email}` });
});

// 3. Simulated Checkout route
app.post('/api/checkout', async (req, res) => {
  const { plan, price } = req.body;
  console.log(`[CHECKOUT] User initiated checkout for ${plan} plan at ${price}`);
  
  try {
    await appendRow('Checkouts', {
      date: new Date().toISOString(),
      plan: plan || 'unknown',
      price: price || 'unknown'
    });
  } catch (err) {
    console.error('Failed to log checkout to Excel:', err);
  }

  // In a real scenario, this would redirect to Stripe/Razorpay
  res.status(200).json({ 
    success: true, 
    message: `Checkout started for ${plan}`,
    checkoutUrl: `https://nexus-agency-mock-checkout.com/pay?plan=${plan.toLowerCase()}` 
  });
});

// 4. Send OTP route (Strictly rate-limited)
app.post('/api/auth/send-otp', authLimiter, (req, res) => {
  const { email } = req.body;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Valid email required' });
  }
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with Expiration TTL (5 minutes)
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });
  
  // Clean up automatically to avoid memory leaks
  setTimeout(() => {
    if (otpStore.has(email) && otpStore.get(email).otp === otp) {
      otpStore.delete(email);
    }
  }, 5 * 60 * 1000);
  
  console.log(`\n================= SECURE OTP =================`);
  console.log(`OTP for ${email}: \x1b[36m${otp}\x1b[0m`);
  console.log(`==============================================\n`);
  
  // Send actual email if configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const mailOptions = {
      from: `"NEXUS AI Agency" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login Code - NEXUS AI Agency',
      text: `Your one-time login code is: ${otp}\n\nThis code will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #c8ff00; background: #000; padding: 10px; border-radius: 4px; text-align: center; text-transform: uppercase;">NEXUS AI Agency</h2>
          <p>Hello,</p>
          <p>Your one-time login password (OTP) is:</p>
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #111; text-align: center; margin: 20px 0;">${otp}</h1>
          <p>This code will automatically expire in 5 minutes.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email send error:', error);
      } else {
        console.log('OTP Email sent successfully:', info.messageId);
      }
    });
  } else {
    console.log('EMAIL_USER and EMAIL_PASS not set. Email not sent, check console for OTP.');
  }

  res.status(200).json({ success: true, message: 'OTP generated and sent.' });
});

// 5. Verify OTP route (Also rate-limited to avoid brute forcing)
app.post('/api/auth/verify-otp', authLimiter, (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Valid email and OTP required' });
  }

  const record = otpStore.get(email);
  
  if (!record || record.expiresAt < Date.now()) {
    otpStore.delete(email); // Cleanup
    console.log(`[AUTH] Failed OTP verification for ${email} (Expired or Not Found)`);
    return res.status(401).json({ success: false, error: 'OTP expired or not found' });
  }

  if (record.otp === otp) {
    otpStore.delete(email); // Invalidate OTP after use
    console.log(`[AUTH] Successfully verified OTP for ${email}. Trial deploying!`);
    return res.status(200).json({ success: true, message: 'Authentication successful' });
  } else {
    console.log(`[AUTH] Failed OTP verification for ${email} (expected ${record.otp}, got ${otp})`);
    return res.status(401).json({ success: false, error: 'Invalid OTP' });
  }
});

// Catch-all route to serve the React app
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Initialize database then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`============================================`);
    console.log(`NEXUS AGENCY BACKEND RUNNING ON PORT ${PORT}`);
    console.log(`Listening for frontend interactions...`);
    console.log(`============================================`);
  });
}).catch(err => {
  console.error('Failed to initialize local Excel Database:', err);
});
