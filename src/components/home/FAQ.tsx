import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "Comment fonctionne l'assistant virtuel ?",
    answer: "Notre assistant utilise une IA avancée pour gérer les appels de manière naturelle. Il peut prendre des rendez-vous, répondre aux questions fréquentes et transférer les appels importants selon vos règles."
  },
  {
    question: "Est-ce que je peux personnaliser les réponses de l'assistant ?",
    answer: "Oui, vous pouvez entièrement personnaliser le script, la voix et le comportement de l'assistant via notre interface de configuration simple."
  },
  {
    question: "Comment sont gérés les rendez-vous ?",
    answer: "L'assistant s'intègre avec Calendly pour gérer automatiquement votre agenda. Il vérifie vos disponibilités en temps réel et confirme les rendez-vous instantanément."
  },
  {
    question: "Que se passe-t-il en cas d'urgence ?",
    answer: "Vous pouvez définir des règles de transfert d'appel pour les situations urgentes. L'assistant peut vous contacter immédiatement selon vos préférences."
  },
  {
    question: "Est-ce que je peux avoir un essai gratuit ?",
    answer: "Oui, nous proposons un essai gratuit de 14 jours pour tester toutes les fonctionnalités de notre service."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Questions Fréquentes
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow">
              <button
                className="w-full px-6 py-4 flex justify-between items-center"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-left">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}