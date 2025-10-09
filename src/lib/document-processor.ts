import { supabase } from './supabase';

export interface ProcessedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'url';
  content: string;
  extractedText?: string;
  keywords?: string[];
  summary?: string;
  processed: boolean;
}

export class DocumentProcessor {
  private static instance: DocumentProcessor;
  private processedDocuments: Map<string, ProcessedDocument> = new Map();

  static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  async processDocument(document: ProcessedDocument): Promise<ProcessedDocument> {
    try {
      let extractedText = '';

      if (document.type === 'pdf') {
        extractedText = await this.extractTextFromPDF(document.content);
      } else if (document.type === 'url') {
        extractedText = await this.extractTextFromURL(document.content);
      }

      // Generate summary and keywords using AI
      const analysis = await this.analyzeDocument(extractedText);

      const processedDoc: ProcessedDocument = {
        ...document,
        extractedText,
        keywords: analysis.keywords,
        summary: analysis.summary,
        processed: true
      };

      // Cache the processed document
      this.processedDocuments.set(document.id, processedDoc);

      // Save to database
      await this.saveProcessedDocument(processedDoc);

      return processedDoc;

    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  private async extractTextFromPDF(base64Content: string): Promise<string> {
    try {
      // For now, return a placeholder - in production, you'd use a PDF parsing library
      // or send to a service that can extract text from PDFs
      return 'Contenu extrait du PDF (fonctionnalité en développement)';
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  }

  private async extractTextFromURL(url: string): Promise<string> {
    try {
      // Fetch the URL content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Basic HTML text extraction (in production, use a proper HTML parser)
      const textContent = html
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return textContent.substring(0, 10000); // Limit to 10k characters

    } catch (error) {
      console.error('Error extracting text from URL:', error);
      return '';
    }
  }

  private async analyzeDocument(text: string): Promise<{ keywords: string[], summary: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Document analysis failed');
      }

      return await response.json();

    } catch (error) {
      console.error('Error analyzing document:', error);
      return { keywords: [], summary: 'Analyse non disponible' };
    }
  }

  private async saveProcessedDocument(document: ProcessedDocument): Promise<void> {
    try {
      const { error } = await supabase
        .from('instruction_documents')
        .update({
          extracted_text: document.extractedText,
          keywords: document.keywords,
          summary: document.summary,
          processed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      if (error) throw error;

    } catch (error) {
      console.error('Error saving processed document:', error);
    }
  }

  async getProcessedDocuments(userId: string): Promise<ProcessedDocument[]> {
    try {
      const { data, error } = await supabase
        .from('instruction_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('processed', true)
        .is('deleted_at', null);

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting processed documents:', error);
      return [];
    }
  }

  async searchDocuments(query: string, userId: string): Promise<ProcessedDocument[]> {
    try {
      const documents = await this.getProcessedDocuments(userId);
      
      const searchTerms = query.toLowerCase().split(' ');
      
      return documents.filter(doc => {
        const searchableText = `${doc.name} ${doc.extractedText} ${doc.summary} ${doc.keywords?.join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
      });

    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}

export const documentProcessor = DocumentProcessor.getInstance();