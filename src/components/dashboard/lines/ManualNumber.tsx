import { useState } from 'react';
import { Phone, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function ManualNumber() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [friendlyName, setFriendlyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get or create Twilio account
      let { data: twilioAccount } = await supabase
        .from('twilio_accounts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let accountId = twilioAccount?.id;

      if (!accountId) {
        const { data: newAccount } = await supabase
          .from('twilio_accounts')
          .insert({
            user_id: user.id,
            account_sid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || 'manual',
            auth_token: 'manual',
            status: 'active',
          })
          .select('id')
          .single();

        accountId = newAccount.id;
      }

      // Insert phone number
      const { error: insertError } = await supabase
        .from('twilio_phone_numbers')
        .insert({
          account_id: accountId,
          phone_number: phoneNumber,
          friendly_name: friendlyName || phoneNumber,
          status: 'active',
        });

      if (insertError) throw insertError;

      setSuccess('Numéro ajouté avec succès ! Vous pouvez maintenant recevoir des appels.');
      setPhoneNumber('');
      setFriendlyName('');

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Error adding number:', err);
      setError(err.message || 'Erreur lors de l\'ajout du numéro');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-green-900 mb-2">Solution rapide pour tester</h3>
        <p className="text-sm text-green-700 mb-2">
          Si vous avez déjà un numéro Twilio, ajoutez-le ici pour commencer à l'utiliser immédiatement.
        </p>
        <ol className="text-xs text-green-600 list-decimal list-inside space-y-1">
          <li>Entrez votre numéro Twilio (format: +33... ou +1...)</li>
          <li>Cliquez sur "Ajouter le numéro"</li>
          <li>Le numéro sera activé et prêt à recevoir des appels</li>
        </ol>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-2 text-red-700 mb-4">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-4 rounded-lg flex items-center gap-2 text-green-700 mb-4">
          <CheckCircle className="w-5 h-5" />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de téléphone Twilio
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+33123456789"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            pattern="^\+[0-9]{10,15}$"
            title="Format: +33123456789 (avec indicatif pays)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Format international requis (ex: +33 pour France, +1 pour US)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du numéro (optionnel)
          </label>
          <input
            type="text"
            value={friendlyName}
            onChange={(e) => setFriendlyName(e.target.value)}
            placeholder="Ex: Ligne principale, Bureau, etc."
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <Phone className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Ajout en cours...' : 'Ajouter le numéro'}
        </Button>
      </form>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Configuration Twilio requise</h4>
        <p className="text-sm text-blue-700 mb-2">
          Après avoir ajouté votre numéro ici, configurez-le dans la console Twilio :
        </p>
        <ol className="text-xs text-blue-600 list-decimal list-inside space-y-1">
          <li>Allez sur <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming" target="_blank" rel="noopener noreferrer" className="underline">console.twilio.com</a></li>
          <li>Cliquez sur votre numéro</li>
          <li>Dans "Voice Configuration", définissez l'URL webhook : <code className="bg-blue-100 px-1 rounded">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-webhook</code></li>
          <li>Méthode : POST</li>
          <li>Sauvegardez</li>
        </ol>
      </div>
    </div>
  );
}
