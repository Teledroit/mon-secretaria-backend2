import { useState, useEffect } from 'react';
import { FileText, Upload, Link as LinkIcon, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { documentSchema } from '@/lib/validation';
import { saveDocument } from '@/lib/supabase-utils';
import { documentProcessor } from '@/lib/document-processor';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'url';
  content: string;
  created_at?: string;
  processed?: boolean;
  summary?: string;
  keywords?: string[];
}

export default function DocumentsConfig() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('instruction_documents')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsSaving(true);
        setError(null);

        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }

        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Content = e.target?.result as string;
          
          const document = {
            name: file.name,
            type: 'pdf' as const,
            content: base64Content,
            user_id: (await supabase.auth.getUser()).data.user?.id
          };

          await documentSchema.parseAsync(document);
          const savedDoc = await saveDocument(document);
          
          // Process the document for AI knowledge base
          try {
            await documentProcessor.processDocument(savedDoc);
            toast.success('Document uploaded and processed successfully');
          } catch (processError) {
            console.error('Error processing document:', processError);
            toast.success('Document uploaded (processing in background)');
          }
          
          setDocuments(prev => [savedDoc, ...prev]);
        };

        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error uploading file:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to upload file');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleUrlAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    const name = formData.get('name') as string;
    
    if (url && name) {
      try {
        const document = {
          name,
          type: 'url' as const,
          content: url,
          user_id: (await supabase.auth.getUser()).data.user?.id
        };

        await documentSchema.parseAsync(document);
        const savedDoc = await saveDocument(document);
        
        // Process the document for AI knowledge base
        try {
          await documentProcessor.processDocument(savedDoc);
          toast.success('URL added and processed successfully');
        } catch (processError) {
          console.error('Error processing document:', processError);
          toast.success('URL added (processing in background)');
        }
        
        setDocuments(prev => [savedDoc, ...prev]);
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        console.error('Error adding URL:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to add URL');
      } finally {
        setIsSaving(false);
      }
    }
  };


  const removeDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('instruction_documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      
      // Only update UI if deletion was successful
      setDocuments(documents.filter(doc => doc.id !== id));
      toast.success('Document removed successfully');
    } catch (err) {
      console.error('Error removing document:', err);
      toast.error('Failed to remove document. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-medium">Documents d'Instructions</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ajouter un PDF d'instructions
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Télécharger un fichier</span>
                  <input type="file" className="sr-only" accept=".pdf" onChange={handleFileUpload} />
                </label>
              </div>
              <p className="text-xs text-gray-500">PDF jusqu'à 10MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ajouter une URL d'instructions
          </label>
          <form onSubmit={handleUrlAdd} className="flex gap-2">
            <input
              type="text"
              name="name"
              required
              placeholder="Nom du document"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="url"
              name="url"
              required
              placeholder="https://..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <Button type="submit" size="sm" disabled={isSaving}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Documents ajoutés</h3>
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  {doc.type === 'pdf' ? (
                    <FileText className="w-4 h-4 text-gray-500" />
                  ) : (
                    <LinkIcon className="w-4 h-4 text-gray-500" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm text-gray-700">{doc.name}</span>
                    {doc.processed && (
                      <div className="text-xs text-green-600 mt-1">✓ Traité par l'IA</div>
                    )}
                    {doc.summary && (
                      <div className="text-xs text-gray-500 mt-1">{doc.summary}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Supprimer
                </button>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Aucun document ajouté
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}