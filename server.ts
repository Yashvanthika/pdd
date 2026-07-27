/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GenAI Client to prevent crashes during startup if API key is not yet set
let aiClient: GoogleGenAI | null = null;
function getGenAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to draft patient emergency communication alerts
app.post('/api/gemini/alert', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { hospitalName, patientName, bloodGroup, urgency, unitsRequired, condition } = req.body;

    if (!bloodGroup || !urgency) {
      res.status(400).json({ error: 'Blood group and urgency are required parameters.' });
      return;
    }

    const client = getGenAIClient();
    
    if (!client) {
      // Fallback message drafting in case Gemini API key is not supplied
      const fallbackPrompt = `🚨 EMERGENCY BLOOD ALERT 🚨\nHospital: ${hospitalName || 'Local Medical Center'}\nPatient: ${patientName || 'Critical Patient'}\nBlood Type: ${bloodGroup} needed immediately.\nUrgency: ${urgency}\nUnits Required: ${unitsRequired || 1} unit(s).\nCondition details: ${condition || 'Undergoing urgent medical procedure'}.\nIf you are nearby and eligible, please accept this request to coordinate instant transport! Help save a life today.`;
      res.json({
        alertMessage: fallbackPrompt,
        fallback: true,
        message: 'Using algorithmic local template alert (Gemini API key is not configured in Settings > Secrets).'
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
    console.error('Gemini alert endpoint failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate message template with Gemini AI.', 
      details: error.message 
    });
  }
});

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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
