import { useState } from 'react';
import Button from '../ui/Button';
import { supabase } from '@/lib/supabase';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      // First, save to Supabase
      const { error: supabaseError } = await supabase
        .from('contact_messages')
        .insert([formData]);

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        setStatus('success'); // On continue même si Supabase échoue
      }

      // Then send email via backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      console.log('Sending to backend URL:', backendUrl);

      fetch(`${backendUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }).catch(error => {
        console.error('Error sending email:', error);
        // On ne change pas le statut même si l'envoi d'email échoue
      });
      
      // Set success status and reset form
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setStatus('success'); // On affiche quand même succès
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Contactez-nous
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              ></textarea>
            </div>
            <div className="text-center">
              <Button 
                type="submit" 
                size="lg"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Envoi en cours...' : 'Envoyer le message'}
              </Button>

              {status === 'success' && (
                <p className="mt-4 text-green-600">
                  Message bien reçu !
                </p>
              )}

              {status === 'error' && (
                <p className="mt-4 text-red-600">
                  {errorMessage}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}