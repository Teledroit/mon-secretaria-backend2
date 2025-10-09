export const STRIPE_PRODUCTS = {
  STARTER: {
    id: 'prod_SKoCExu7rUquSK',
    priceId: 'price_1RQ8ZxHCmF7qRHmmpTKP7VFi',
    name: 'mONsECRETARIA - Boss test',
    description: 'Abonnement mensuel',
    mode: 'subscription' as const,
    price: 1,
    features: [
      "📞 49 appels par mois",
      "Facturation à l'usage pour l'IA",
      "Support par email",
      "Idéal pour les jeunes avocats"
    ]
  },
  PREMIUM: {
    id: 'prod_SFwDe2BDOO3Qbb',
    priceId: 'price_1RLQL4HCmF7qRHmmOjAvQVgi',
    name: 'MonSecretarIA - Cabinet complet',
    description: 'Abonnement mensuel', 
    mode: 'subscription' as const,
    price: 397,
    features: [
      "📞 Appels illimités",
      "Facturation à l'usage pour l'IA",
      "Support prioritaire 24/7",
      "Toutes les fonctionnalités avancées",
      "Intégration Calendly",
      "Analytics avancés"
    ]
  },
  AI_MINUTES: {
    id: 'prod_SLGvP5uDoSmkWB',
    priceId: 'price_1RQaNxHCmF7qRHmmApQHAaOY',
    name: 'Usage IA',
    description: 'Usage IA sur MonSecretarIA',
    mode: 'subscription' as const,
    price: 0,
    features: []
  }
} as const;

export type ProductId = keyof typeof STRIPE_PRODUCTS;
