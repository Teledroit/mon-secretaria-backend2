import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { redirectToCheckout } from '@/lib/stripe';

const schema = z.object({
  email: z.string().email('Email invalide'),
  fullName: z.string().min(2, 'Le nom complet est requis'),
  phone: z.string().min(10, 'Le numéro de téléphone est requis'),
  companyName: z.string().min(2, 'Le nom du cabinet est requis'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPlan } = location.state || {};

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    let userId: string | undefined;

    try {
      // Sign up with auth and get the session
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            company_name: data.companyName || null
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (signUpError) {
        throw signUpError;
      }
      
      if (!authData.user) {
        throw new Error('No user data returned');
      }
      
      userId = authData.user.id;
      
      // Wait for user record to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Always redirect to checkout if coming from pricing
      if (selectedPlan) {
        try {
          await redirectToCheckout(selectedPlan);
          return;
        } catch (checkoutError: any) {
          console.error('Checkout error:', checkoutError);
          // If checkout fails, redirect to pricing
          navigate('/pricing', { 
            state: { 
              message: 'Une erreur est survenue lors du paiement. Veuillez réessayer.' 
            }
          });
          return;
        }
      }

      // If no plan selected, redirect to pricing
      navigate('/pricing', { 
        state: { 
          message: 'Veuillez choisir une formule pour continuer' 
        }
      });

    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.message === 'User already registered'
          ? 'Un compte existe déjà avec cet email'
          : err.message === 'No session after signup'
          ? 'Erreur lors de la création du compte. Veuillez réessayer.'
          : 'Une erreur est survenue lors de la création du compte'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link 
          to="/" 
          className="absolute top-8 left-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Link>

        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Créer votre compte
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <input
                id="fullName"
                type="text"
                {...register('fullName')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Nom du cabinet
              </label>
              <input
                id="companyName"
                type="text"
                {...register('companyName')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <Button 
                type="submit" 
                disabled={isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? 'Création en cours...' : 'Créer mon compte'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Déjà inscrit ?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}