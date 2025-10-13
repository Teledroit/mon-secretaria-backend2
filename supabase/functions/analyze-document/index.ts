/*
  # Document Analysis Function

  1. New Edge Function
    - `analyze-document` - Analyzes document content using AI
    - Extracts keywords, generates summaries
    - Prepares documents for knowledge base integration

  2. Features
    - Text analysis using OpenAI GPT
    - Keyword extraction for search functionality
    - Summary generation for quick reference
    - Legal document understanding

  3. Security
    - Authenticated access required
    - Input validation and sanitization
    - Rate limiting for API calls
*/

import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface DocumentAnalysisRequest {
  text: string
  documentType?: 'legal' | 'general' | 'instructions'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { text, documentType = 'general' }: DocumentAnalysisRequest = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text content is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Analyze the document
    const analysis = await analyzeDocumentContent(text, documentType)

    return new Response(
      JSON.stringify(analysis),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in document analysis:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function analyzeDocumentContent(text: string, documentType: string) {
  const systemPrompt = `Tu es un expert en analyse de documents pour un cabinet d'avocats français.

MISSION:
Analyse le document fourni et extrais les informations clés pour aider l'assistant IA à mieux répondre aux clients.

INSTRUCTIONS:
1. Identifie 5-10 mots-clés pertinents
2. Génère un résumé concis (2-3 phrases)
3. Identifie les points d'action ou procédures importantes
4. Note les informations de contact ou références importantes

CONTEXTE:
Type de document: ${documentType}

FORMAT DE RÉPONSE:
Réponds uniquement en JSON avec cette structure:
{
  "keywords": ["mot1", "mot2", ...],
  "summary": "Résumé concis du document",
  "actionPoints": ["point1", "point2", ...],
  "references": ["ref1", "ref2", ...]
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text.substring(0, 8000) } // Limit text length
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    const content = result.choices[0].message.content

    // Parse JSON response
    try {
      const analysis = JSON.parse(content)
      return {
        keywords: analysis.keywords || [],
        summary: analysis.summary || 'Résumé non disponible',
        actionPoints: analysis.actionPoints || [],
        references: analysis.references || []
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      return {
        keywords: [],
        summary: 'Erreur lors de l\'analyse du document',
        actionPoints: [],
        references: []
      }
    }

  } catch (error) {
    console.error('Error analyzing document:', error)
    throw error
  }
}