import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { SAMPLE_BANGLADESH_FOODS } from '../data/bangladeshFoodDatabase';
import { executeNutriGuideChat } from './nutritionAIHandler';

export function createExpressApp(): express.Express {
  const app = express();

  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      appName: 'Nutri Guide',
      targetRegion: 'Bangladesh',
      version: '2.0.0-clean-backend',
      timestamp: new Date().toISOString()
    });
  });

  // Food Database API Sample
  app.get('/api/food-database/sample', (req, res) => {
    res.json({
      success: true,
      count: SAMPLE_BANGLADESH_FOODS.length,
      items: SAMPLE_BANGLADESH_FOODS
    });
  });

  // NutriGuide AI Assistant Endpoint
  app.post('/api/ai/nutrition-assistant', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: 'Gemini API key is not configured in server environment settings.',
          isConfigured: false
        });
      }

      const {
        prompt,
        userProfile,
        nutritionCalculations,
        currentMealPlan,
        foodDatabaseContext,
        activeContext,
        chatHistory
      } = req.body || {};

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'A valid user message prompt is required.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const chatResult = await executeNutriGuideChat(ai, {
        prompt: prompt.trim(),
        userProfile,
        nutritionCalculations,
        currentMealPlan,
        foodDatabaseContext,
        activeContext,
        chatHistory
      });

      return res.json({
        success: true,
        answer: chatResult.text,
        modelUsed: chatResult.modelUsed
      });
    } catch (err: any) {
      console.error('[NutriGuide API Error]', err);
      let errorMessage = 'The nutrition assistant is momentarily unavailable. Please try again shortly.';
      
      const rawMsg = String(err?.message || err || '');
      if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota')) {
        errorMessage = 'The AI service is currently experiencing high demand or rate limits. Please try again in a few moments.';
      } else if (rawMsg.includes('timed out')) {
        errorMessage = 'The request took too long to complete. Please try again.';
      } else if (rawMsg && !rawMsg.startsWith('{') && !rawMsg.includes('"code":')) {
        errorMessage = rawMsg;
      }

      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  return app;
}
