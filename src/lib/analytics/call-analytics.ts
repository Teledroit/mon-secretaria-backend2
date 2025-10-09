import { supabase } from '../supabase';
import { cacheManager } from '../performance/cache-manager';

export interface CallAnalytics {
  totalCalls: number;
  averageDuration: number;
  conversionRate: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  peakHours: Array<{ hour: number; count: number }>;
  topKeywords: Array<{ keyword: string; frequency: number }>;
  monthlyTrends: Array<{ month: string; calls: number; conversions: number }>;
}

export interface CallInsights {
  busyPeriods: Array<{ start: string; end: string; intensity: number }>;
  commonQuestions: Array<{ question: string; frequency: number; avgSentiment: string }>;
  transferReasons: Array<{ reason: string; count: number }>;
  appointmentTypes: Array<{ type: string; count: number; avgDuration: number }>;
}

export class CallAnalyticsEngine {
  private static instance: CallAnalyticsEngine;

  static getInstance(): CallAnalyticsEngine {
    if (!CallAnalyticsEngine.instance) {
      CallAnalyticsEngine.instance = new CallAnalyticsEngine();
    }
    return CallAnalyticsEngine.instance;
  }

  async getCallAnalytics(userId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<CallAnalytics> {
    const cacheKey = `analytics:${userId}:${period}`;
    const cached = cacheManager.get<CallAnalytics>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const dateRange = this.getDateRange(period);
      
      // Fetch calls with transcriptions
      const { data: calls, error } = await supabase
        .from('calls')
        .select(`
          *,
          transcriptions (
            content,
            sentiment,
            timestamp
          )
        `)
        .eq('user_id', userId)
        .gte('start_time', dateRange.start.toISOString())
        .lte('start_time', dateRange.end.toISOString());

      if (error) throw error;

      const analytics = this.processCallData(calls || []);
      
      // Cache for 10 minutes
      cacheManager.set(cacheKey, analytics, 10 * 60 * 1000);
      
      return analytics;

    } catch (error) {
      console.error('Error fetching call analytics:', error);
      throw error;
    }
  }

  async getCallInsights(userId: string): Promise<CallInsights> {
    const cacheKey = `insights:${userId}`;
    const cached = cacheManager.get<CallInsights>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data: calls, error } = await supabase
        .from('calls')
        .select(`
          *,
          transcriptions (
            content,
            sentiment,
            timestamp
          )
        `)
        .eq('user_id', userId)
        .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) throw error;

      const insights = this.generateInsights(calls || []);
      
      // Cache for 30 minutes
      cacheManager.set(cacheKey, insights, 30 * 60 * 1000);
      
      return insights;

    } catch (error) {
      console.error('Error generating call insights:', error);
      throw error;
    }
  }

  private getDateRange(period: 'day' | 'week' | 'month'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return { start, end };
  }

  private processCallData(calls: any[]): CallAnalytics {
    const totalCalls = calls.length;
    const completedCalls = calls.filter(call => call.status === 'completed');
    
    // Calculate average duration
    const totalDuration = completedCalls.reduce((sum, call) => {
      if (call.end_time && call.start_time) {
        return sum + (new Date(call.end_time).getTime() - new Date(call.start_time).getTime());
      }
      return sum;
    }, 0);
    
    const averageDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length / 1000 / 60 : 0;

    // Calculate conversion rate (calls that resulted in appointments)
    const conversions = calls.filter(call => 
      call.transcriptions?.some((t: any) => 
        t.content.toLowerCase().includes('rendez-vous') || 
        t.content.toLowerCase().includes('appointment')
      )
    ).length;
    
    const conversionRate = totalCalls > 0 ? (conversions / totalCalls) * 100 : 0;

    // Sentiment distribution
    const sentiments = calls.flatMap(call => 
      call.transcriptions?.map((t: any) => t.sentiment) || []
    ).filter(Boolean);
    
    const sentimentDistribution = {
      positive: sentiments.filter(s => s === 'positive').length,
      neutral: sentiments.filter(s => s === 'neutral').length,
      negative: sentiments.filter(s => s === 'negative').length
    };

    // Peak hours analysis
    const hourCounts = new Array(24).fill(0);
    calls.forEach(call => {
      const hour = new Date(call.start_time).getHours();
      hourCounts[hour]++;
    });
    
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Extract keywords from transcriptions
    const allText = calls.flatMap(call => 
      call.transcriptions?.map((t: any) => t.content) || []
    ).join(' ').toLowerCase();
    
    const words = allText.split(/\s+/).filter(word => word.length > 3);
    const wordFreq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topKeywords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, frequency]) => ({ keyword, frequency }));

    // Monthly trends (simplified)
    const monthlyTrends = [
      { month: 'Ce mois', calls: totalCalls, conversions }
    ];

    return {
      totalCalls,
      averageDuration,
      conversionRate,
      sentimentDistribution,
      peakHours,
      topKeywords,
      monthlyTrends
    };
  }

  private generateInsights(calls: any[]): CallInsights {
    // Analyze busy periods
    const hourlyDistribution = new Array(24).fill(0);
    calls.forEach(call => {
      const hour = new Date(call.start_time).getHours();
      hourlyDistribution[hour]++;
    });

    const maxCalls = Math.max(...hourlyDistribution);
    const busyPeriods = hourlyDistribution
      .map((count, hour) => ({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        intensity: maxCalls > 0 ? count / maxCalls : 0
      }))
      .filter(period => period.intensity > 0.3);

    // Common questions analysis
    const questions = calls.flatMap(call => 
      call.transcriptions?.filter((t: any) => t.content.includes('?')) || []
    );
    
    const questionFreq = questions.reduce((acc, q) => {
      const question = q.content.substring(0, 100);
      if (!acc[question]) {
        acc[question] = { count: 0, sentiments: [] };
      }
      acc[question].count++;
      acc[question].sentiments.push(q.sentiment);
      return acc;
    }, {} as Record<string, { count: number; sentiments: string[] }>);

    const commonQuestions = Object.entries(questionFreq)
      .map(([question, data]) => ({
        question,
        frequency: data.count,
        avgSentiment: this.calculateAvgSentiment(data.sentiments)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Transfer reasons
    const transferReasons = [
      { reason: 'Urgence', count: calls.filter(c => c.transcriptions?.some((t: any) => t.content.toLowerCase().includes('urgent'))).length },
      { reason: 'Dossier complexe', count: calls.filter(c => c.transcriptions?.some((t: any) => t.content.toLowerCase().includes('complexe'))).length },
      { reason: 'Demande spécifique', count: calls.filter(c => c.transcriptions?.some((t: any) => t.content.toLowerCase().includes('spécifique'))).length }
    ].filter(r => r.count > 0);

    // Appointment types
    const appointmentTypes = [
      { type: 'Consultation initiale', count: 0, avgDuration: 45 },
      { type: 'Suivi dossier', count: 0, avgDuration: 30 },
      { type: 'Urgence', count: 0, avgDuration: 60 }
    ];

    return {
      busyPeriods,
      commonQuestions,
      transferReasons,
      appointmentTypes
    };
  }

  private calculateAvgSentiment(sentiments: string[]): string {
    const counts = sentiments.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const max = Math.max(...Object.values(counts));
    return Object.keys(counts).find(key => counts[key] === max) || 'neutral';
  }
}

export const callAnalytics = CallAnalyticsEngine.getInstance();