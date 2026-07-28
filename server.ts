/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabasePublicKey = (
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();
const isSupabaseServerConfigured = Boolean(supabaseUrl && supabasePublicKey);
const isAiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

function getAllowedCorsOrigin(origin: string | undefined): string | null {
  if (!origin || CORS_ORIGINS.length === 0) {
    return null;
  }

  if (CORS_ORIGINS.includes('*')) {
    return '*';
  }

  return CORS_ORIGINS.includes(origin) ? origin : null;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin = getAllowedCorsOrigin(origin);

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(origin && !allowedOrigin ? 403 : 204);
    return;
  }

  next();
});

app.use(express.json({ limit: '64kb' }));

function getSupabaseAuthClient(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabasePublicKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

function getBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

async function requireDispatcherSession(
  req: express.Request,
  res: express.Response
): Promise<{ userId: string; role: string } | null> {
  if (!isSupabaseServerConfigured) {
    res.status(503).json({ error: 'Supabase authentication is not configured on this server.' });
    return null;
  }

  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Sign in again to use the outreach service.' });
    return null;
  }

  const client = getSupabaseAuthClient(token);
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: 'Your session could not be verified.' });
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role,status')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    res.status(403).json({ error: 'Your BloodLink profile could not be verified.' });
    return null;
  }

  if (!['hospital', 'admin'].includes(profile.role) || profile.status !== 'APPROVED') {
    res.status(403).json({ error: 'Only approved hospital or administrator accounts can draft outreach alerts.' });
    return null;
  }

  return {
    userId: authData.user.id,
    role: profile.role,
  };
}

// Lazy-loaded GenAI Client to prevent crashes during startup if API key is not yet set
let aiClient: GoogleGenAI | null = null;
function getGenAIClient() {
  if (!aiClient) {
    if (!isAiConfigured) {
      return null;
    }

    const key = process.env.GEMINI_API_KEY as string;
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'bloodlink-web',
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to draft patient emergency communication alerts
const draftOutreachAlert = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const dispatcher = await requireDispatcherSession(req, res);
    if (!dispatcher) {
      return;
    }

    const { hospitalName, patientName, bloodGroup, urgency, unitsRequired, condition } = req.body;

    if (!bloodGroup || !urgency) {
      res.status(400).json({ error: 'Blood group and urgency are required parameters.' });
      return;
    }

    const client = getGenAIClient();
    
    if (!client) {
      // Fallback message drafting in case the AI API key is not supplied.
      const fallbackPrompt = `Emergency blood request\nHospital: ${hospitalName || 'Local Medical Center'}\nPatient: ${patientName || 'Critical Patient'}\nBlood Type: ${bloodGroup} needed immediately.\nUrgency: ${urgency}\nUnits Required: ${unitsRequired || 1} unit(s).\nCondition details: ${condition || 'Undergoing urgent medical procedure'}.\nIf you are nearby and eligible, please accept this request in BloodLink.`;
      res.json({
        alertMessage: fallbackPrompt,
        fallback: true,
        message: 'Using local template because the AI outreach service is not configured.'
      });
      return;
    }

    const aiPrompt = `You are the primary dispatcher for 'BloodLink', an intelligent emergency blood coordination mobile application.
Draft an extremely high-impact, direct, urgent, yet reassuring SMS outreach alert message to notify matched nearby eligible blood donors.

Patient and request details:
- Patient Name: ${patientName || 'Confidential (Anonymized Emergency)'}
- Required Blood Group: ${bloodGroup}
- Hospital Location: ${hospitalName || 'City Central General Hospital'}
- Urgency Level: ${urgency} (${urgency === 'CRITICAL' ? 'Immediate danger, minutes count!' : 'High priority'})
- Blood Units Required: ${unitsRequired || 'Multiple'} units
- Medical Case Condition: ${condition || 'Surgical emergency / trauma'}

Guidelines:
1. Keep the message under 200 characters so it fits on a single mobile SMS text.
2. Ensure you clearly state the Blood Type, Hospital, and a strong action-oriented call to response (e.g., "Tap the link below in-app to accept this emergency coordination!").
3. Include critical urgency indicators depending on the Level ("🚨 EMERGENCY", "CRITICAL ALERT!").
4. Maintain medical dignity and empathy. Do not write flowery or overly conversational introductory lines. Start directly with the emergency dispatcher.
5. Provide ONLY the text of the alert. No other explanations, headers, formatting, or wrapping quotes.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: aiPrompt,
    });

    const text = response.text || '';
    res.json({
      alertMessage: text.trim().replace(/^["']|["']$/g, ''), // Strip surrounding blockquotes
      fallback: false
    });

  } catch (error: any) {
    console.error('AI outreach endpoint failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate message template with the AI outreach service.', 
      details: error.message 
    });
  }
};

app.post('/api/outreach/alert', draftOutreachAlert);
app.post('/api/gemini/alert', draftOutreachAlert);

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'bloodlink-backend',
    environment: process.env.NODE_ENV || 'development',
    supabaseConfigured: isSupabaseServerConfigured,
    aiConfigured: isAiConfigured,
    time: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BloodLink Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
