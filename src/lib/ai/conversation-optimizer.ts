import { supabase } from '../supabase';
import { cacheManager } from '../performance/cache-manager';

export interface ConversationPattern {
  trigger: string;
  response: string;
  confidence: number;
  usage: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface AIOptimizationConfig {
  dynamicTemperature: boolean;
  contextAwareness: boolean;
  learningMode: boolean;
  responseOptimization: boolean;
}

export class ConversationOptimizer {
  private static instance: ConversationOptimizer;
  private patterns: ConversationPattern[] = [];
  private config: AIOptimizationConfig = {
    dynamicTemperature: true,
    contextAwareness: true,
    learningMode: true,
    responseOptimization: true
  };

  static getInstance(): ConversationOptimizer {
    if (!ConversationOptimizer.instance) {
      ConversationOptimizer.instance = new ConversationOptimizer();
    }
    return ConversationOptimizer.instance;
  }

  async analyzeConversationPatterns(userId: string): Promise<ConversationPattern[]> {
    const cacheKey = `patterns:${userId}`;
    const cached = cacheManager.get<ConversationPattern[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data: transcriptions, error } = await supabase
        .from('transcriptions')
        .select(`
          content,
          sentiment,
          calls!inner(user_id)
        `)
        .eq('calls.user_id', userId)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const patterns = this.extractPatterns(transcriptions || []);
      
      // Cache for 1 hour
      cacheManager.set(cacheKey, patterns, 60 * 60 * 1000);
      
      return patterns;

    } catch (error) {
      console.error('Error analyzing conversation patterns:', error);
      return [];
    }
  }

  private extractPatterns(transcriptions: any[]): ConversationPattern[] {
    const patterns: Map<string, ConversationPattern> = new Map();

    transcriptions.forEach(t => {
      const content = t.content.toLowerCase();
      const words = content.split(' ').filter(word => word.length > 3);
      
      words.forEach(word => {
        const key = word;
        if (patterns.has(key)) {
          const pattern = patterns.get(key)!;
          pattern.usage++;
          pattern.confidence = Math.min(1, pattern.confidence + 0.1);
        } else {
          patterns.set(key, {
            trigger: word,
            response: this.generateOptimalResponse(word),
            confidence: 0.5,
            usage: 1,
            sentiment: t.sentiment || 'neutral'
          });
        }
      });
    });

    return Array.from(patterns.values())
      .filter(p => p.usage > 2)
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 20);
  }

  private generateOptimalResponse(trigger: string): string {
    const responses: Record<string, string> = {
      'urgent': 'Je comprends que c\'est urgent. Je vais vous transférer immédiatement.',
      'rendez-vous': 'Je peux vous aider à planifier un rendez-vous. Quel type de consultation ?',
      'prix': 'Pour les tarifs, je vais vous mettre en relation avec notre équipe.',
      'divorce': 'Pour les questions de divorce, je vais vous diriger vers notre spécialiste.',
      'contrat': 'Concernant les contrats, un avocat pourra vous conseiller précisément.',
      'accident': 'Pour les accidents, nous avons une expertise spécialisée. Je vous transfère.'
    };

    return responses[trigger] || 'Je peux vous aider avec votre demande. Pouvez-vous me donner plus de détails ?';
  }

  async optimizeAIParameters(userId: string, callVolume: number): Promise<any> {
    try {
      const patterns = await this.analyzeConversationPatterns(userId);
      
      // Dynamic temperature adjustment based on call volume and patterns
      let temperature = 0.7; // Default
      
      if (callVolume > 50) {
        temperature = 0.5; // Lower temperature for high volume (more consistent)
      } else if (callVolume < 10) {
        temperature = 0.8; // Higher temperature for low volume (more creative)
      }

      // Adjust based on sentiment patterns
      const positiveRatio = patterns.filter(p => p.sentiment === 'positive').length / patterns.length;
      if (positiveRatio < 0.6) {
        temperature = Math.max(0.3, temperature - 0.2); // More conservative
      }

      // Generate optimized system instructions
      const optimizedInstructions = this.generateOptimizedInstructions(patterns);

      return {
        temperature,
        systemInstructions: optimizedInstructions,
        recommendedEngine: callVolume > 100 ? 'gpt35' : 'gpt4',
        patterns: patterns.slice(0, 10)
      };

    } catch (error) {
      console.error('Error optimizing AI parameters:', error);
      throw error;
    }
  }

  private generateOptimizedInstructions(patterns: ConversationPattern[]): string {
    const commonTriggers = patterns.slice(0, 5);
    
    let instructions = `Tu es un assistant virtuel professionnel pour un cabinet d'avocats français.

RÉPONSES OPTIMISÉES basées sur l'analyse des conversations :

`;

    commonTriggers.forEach(pattern => {
      instructions += `- Si le client mentionne "${pattern.trigger}" : ${pattern.response}\n`;
    });

    instructions += `
RÈGLES D'OPTIMISATION :
- Réponses courtes et précises pour la synthèse vocale
- Détection proactive des besoins clients
- Transfert intelligent selon le contexte
- Maintien d'un ton professionnel et empathique

APPRENTISSAGE CONTINU :
- Adaptation basée sur les retours clients
- Optimisation des temps de réponse
- Amélioration continue de la précision`;

    return instructions;
  }

  async applyOptimizations(userId: string, optimizations: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('configurations')
        .update({
          temperature: optimizations.temperature,
          system_instructions: optimizations.systemInstructions,
          nlp_engine: optimizations.recommendedEngine,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Invalidate cache
      cacheManager.invalidate(`patterns:${userId}`);

    } catch (error) {
      console.error('Error applying optimizations:', error);
      throw error;
    }
  }
}

export const conversationOptimizer = ConversationOptimizer.getInstance();