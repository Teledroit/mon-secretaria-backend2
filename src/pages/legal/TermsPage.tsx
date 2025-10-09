import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<'cgv' | 'cgu'>('cgv');
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8">
              Conditions Générales
            </h1>

            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('cgv')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'cgv'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Conditions Générales de Vente
                  </button>
                  <button
                    onClick={() => setActiveTab('cgu')}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'cgu'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Conditions Générales d'Utilisation
                  </button>
                </nav>
              </div>
            </div>

            <div className="prose prose-gray max-w-none">
              {activeTab === 'cgv' ? (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Conditions générales de vente</h2>
                  <p className="text-sm text-gray-500 mb-6">14/05/2025</p>
                  
                  <p className="mb-4">
                    Les présentes "Conditions Générales de vente" (CGV) définissent les modalités qui vous permettent de bénéficier des services de MonSecretarIA. En souscrivant à titre onéreux ou gratuit à tout produit et/ou service présenté sur le site, vous confirmez accepter sans réserve l'ensemble des dispositions des Conditions Générales.
                  </p>
                  <p className="mb-4">
                    Si vous n'acceptez pas ces Conditions Générales, vous ne pouvez pas bénéficier des services de MonSecretarIA.com.
                  </p>
                  <p className="mb-4">
                    Le site MonSecretarIA se réserve le droit de modifier à n'importe quel moment les présentes CGV, notamment en mettant en ligne une nouvelle version de son site.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 1. DÉFINITIONS</h3>
                  <p className="mb-4">
                    Les Conditions Générales relatives à la prestation comportent les définitions suivantes : 
                    <br />– "Objet numérique" ou "abonnement de service" : œuvre numérique représentée par l'accès à un espace membre.
                    <br />– "librairie d'Items numériques" : ensemble de pages Internet exploitées par la librairie contenant l'offre numérique de MonSecretarIA
                    <br />– "fichier numérique" : fichier informatique, à un format défini, permettant la représentation sur un appareil électronique d'une œuvre de l'esprit. À ce titre, la même œuvre proposée sous deux formats différents constitue deux fichiers numériques distincts devant faire l'objet de commandes et de règlements distincts. 
                    <br />– "téléchargement" : transmission d'un fichier numérique intégrant l'item numérique choisi par le client sur un appareil électronique connecté à Internet et sa reproduction sur l'appareil de lecture électronique du client aux seules fins de lecture par ce client.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 2. OBJET</h3>
                  <p className="mb-4">
                    Les présentes constituent, à ce jour, les conditions générales de la prestation proposée en accès/envoi d'identifiants par MonSecretarIA. Ces conditions générales peuvent faire l'objet de modifications. Les conditions applicables sont alors celles en vigueur à la date de la passation de votre commande. En conséquence, vous êtes invité à venir les consulter régulièrement afin de vous tenir informé des évolutions les plus récentes. Le fait de "Valider le paiement" sur la commande certifie votre consentement sans réserve des présentes conditions générales.
                  </p>
                  <p className="mb-4">
                    Sauf preuve contraire, les termes de la commande conservés par MonSecretarIA sous forme d'enregistrements électroniques sur le site d'achat constitueront la preuve de l'ensemble des transactions passées entre le client et Mon-SecretarIA.com. Les modalités de téléchargement, de lecture et les contraintes techniques générales associées au téléchargement de fichiers numériques proposés par MonSecretarIA sont présentées en détail et mises à jour sur les pages de la prestation. En aucun cas, une réclamation ou demande de remboursement ne pourra être effectuée sur la base d'une méconnaissance ou d'un refus de vérifier ces modalités.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 3. MODIFICATION DE L'OFFRE</h3>
                  <p className="mb-4">
                    MonSecretarIA se réserve le droit d'apporter à son offre numérique présentée sur la prestation toutes les modifications et améliorations qu'elle jugera nécessaire ou utile et ne sera pas responsable des dommages de toute nature pouvant survenir de ce fait. 
                    <br />Par ailleurs, MonSecretarIA se réserve le droit, sans préavis ni indemnité, d'arrêter définitivement une offre numérique qu'elle propose sur sa librairie de prestation et ne sera pas responsable des dommages de toute nature pouvant survenir de ce fait.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 4. PROCESSUS D'ACHAT</h3>
                  <p className="mb-4">
                    Afin de bénéficier des services proposés par MonSecretarIA, vous devez télécharger et/ou consulter vos informations sur le site internet www. Mon-SecretarIA.com.
                  </p>
                  <p className="mb-4">
                    Vous déclarez être âgé d'au moins 18 ans et avoir la capacité juridique légale afin d'effectuer le paiement préalable à la création de votre site, nécessaire pour bénéficier de la prestation proposée par MonSecretarIA. Pour chaque demande et après avoir sélectionné votre prestation, vous devez fournir une adresse électronique valide afin d'être notifié de votre confirmation de commande et avoir pris connaissances des conditions de vente. La passation d'une commande sur le site est effectuée via la plateforme de distribution Stripe.  Lors de la Commande, le Client accepte de fournir les informations qui lui sont demandées et s'engage sur la véracité de ces dernières :
                    <br />• Nom et prénom
                    <br />• Téléphone
                    <br />• Adresse électronique et postale
                    <br />• Le type de la carte de paiement, le numéro de carte, la date d'expiration et le cryptogramme de la carte ou le compte PayPal
                  </p>
                  <p className="mb-4">
                    Les modalités de souscription sont les suivantes pour chaque client :
                    <br />Ajout au panier de l'abonnement qu'il souhaite acquérir
                    <br />Le client valide sa Commande en cliquant sur « commander » et prend connaissance des CGV par le biais d'un lien, et les accepte en cochant la mention « acceptation des CGV »
                    <br />Le Professionnel indique l'adresse de facturation
                    <br />Le client aura accès à un récapitulatif de sa Commande avant de procéder au paiement
                    <br />Le client procède au paiement de la Commande et reçoit un mail de confirmation de prise en compte de sa Commande
                    <br /> MonSecretarIA notifie par email la Commande d'abonnement au Professionnel par mail sur son système d'information ou via son espace Professionnel sur le Site
                  </p>
                  <p className="mb-4">
                    Les prestations et produits proposés sur le site sont livrés instantanément par voie électronique à l'adresse mail indiquée par le client lors de la commande et/ou en accès direct automatiquement sur son espace membre. L'utilisation des produits numériques se fera grâce à la plateforme Eleven Labs, Chat GPT, Google TTS et/ou Twilio. MonSecretarIA s'engage à procéder au remboursement de la commande en cas d'erreur technique dans l'envoi de ces identifiants dans un délai de 14 jours, sur demande expresse du client. L'accès est ouvert uniquement à titre personnel et demeure valide pendant un délai indiqué qui dépend du type de prestation commandée. 
                  </p>
                  <p className="mb-4">
                    À partir du moment où le client a accès à son espace membre ou d'identification en ligne du service numérique commandé, il ne bénéficie plus d'aucune possibilité d'annuler sa commande et le prix de l'achat sera automatiquement débité, même s'il décide par la suite de renoncer au téléchargement/visionnage desdits fichiers. Tout enregistrement sur un support externe est prohibé. Les prestations et produits proposés sur le site sont livrés par voie électronique à l'adresse mail indiquée par le client lors de la commande. 
                  </p>
                  <p className="mb-4">
                    Dès l'envoi des liens de téléchargement ou de connexion de consultation, les commandes de création de site sont réputées fermes et définitives et ne peuvent donner lieu à aucun échange ni remboursement.
                    <br />Vous prenez acte de ce que le délai de rétractation de quatorze jours ouvert par l'article L.121-20-20 du Code de la Consommation ne peut pas s'appliquer, dès lors que la commande a été exécutée par l'envoi de liens de téléchargement/ connexion, qui équivalent à une livraison définitive du produit. 
                  </p>
                  <p className="mb-4">
                    Le droit de rétractation court toujours durant 7 jours tant que la commande n'a pas été délivrée. Est exempt de toute rétractation la "fourniture de biens confectionnés selon les spécifications du consommateur ou nettement personnalisés" (article L. 221-28 du code de la consommation). En cas de difficulté, et notamment au cas où vous ne recevriez pas les liens de téléchargement ou de lecture en ligne sur l'adresse mail associée à votre compte, vous pouvez contacter le service client par e-mail à contact.monsecretaria@gmail.com
                  </p>
                  <p className="mb-4">
                    Pour exercer son droit de rétractation, le Client doit notifier sa décision de se rétracter au moyen d'une déclaration dénuée d'ambiguïté à contact.monsecretaria@gmail.com
                    <br />Pour que le délai de rétractation soit respecté, le Client doit transmettre sa communication relative à l'exercice du droit de rétractation avant l'expiration du délai de rétractation de sept (7) jours pour les produits numériques dont font partie les créations de site internet tant que celles-ci n'ont pas été effectuées. 
                    <br />En cas de rétractation de la part du Client, MonSecretarIA s'engage à rembourser la totalité des sommes versées, y compris les frais de Livraison, sans retard injustifié, et au plus tard dans les quatorze (14) jours à compter de la date à laquelle il est informé de la décision du Client de se rétracter (Article L.221-24 du Code de la consommation). 
                    <br />En cas de défaut de conformité ou de mauvais fonctionnement d'un produit vendu, le client devra formuler par email, au plus tard le deuxième jour ouvré suivant la commande, toute réclamation. Toute réclamation formulée au-delà de ce délai et/ou non effectuée selon les modalités ci-dessus définies sera rejetée sans possibilité de recours et dégagera le site mon-secretaria.fr de toute responsabilité.
                    <br />MonSecretarIA utilise des outils tiers pour son traitement des paiements notamment Stripe et n'est connecté à aucune des informations de paiement fournies, telles que la carte de crédit, de quelque manière que ce soit. Si le propriétaire de l'un de ces outils tiers refuse d'autoriser un paiement, le propriétaire ne peut pas fournir le service et ne sera donc pas responsable de tout retard ou défaut de livraison.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 5. PRIX</h3>
                  <p className="mb-4">
                    Les prix figurant dans le catalogue publié sur le site sont indiqués en euros TTC. Le montant de la TVA sera indiqué sur la facture. 
                    <br />MonSecretarIA se réserve le droit de modifier ses prix à tout moment. La prestation sera facturée sur la base des tarifs en vigueur au moment de la validation de la commande par MonSecretarIA telle que prévue à l'Article 4 des présentes conditions générales de vente. 
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 6. CONDITIONS TARIFAIRES</h3>
                  <p className="mb-4">
                    Le Client devra régler les Prestations au moment de la Commande en utilisant une des options suivantes :
                    <br />• Par carte bancaire (Visa, carte bleue, Mastercard) avec possibilité d'enregistrement de la carte, cryptée et gérée par FOURNISSEUR DE PAIEMENT (stripe).
                    <br />MonSecretarIA se réserve le droit de ne pas proposer un ou plusieurs modes de paiements ci-dessus, pour tout motif légitime et notamment dans l'hypothèse où :
                    <br />• L'une des précédentes Commandes du Client n'aurait pas été intégralement payée à
                    l'échéance ou un litige relatif au paiement d'une des précédentes Commandes serait
                    en cours de traitement
                    <br />• Des éléments graves et concordants feraient peser un soupçon de fraude sur la
                    Commande.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 7. PREUVE</h3>
                  <p className="mb-4">
                    Sauf preuve contraire, les données enregistrées sur votre compte constituent la preuve de l'ensemble des commandes que vous avez passées.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 8. RESPONSABILITÉ</h3>
                  <p className="mb-4">
                    Il est clairement entendu que les obligations mises à la charge de MonSecretarIA dans le cadre de sa librairie de prestation, sont des obligations de moyen. 
                    <br />C'est ainsi que :
                    <br />1. MonSecretarIA ne peut pas être tenue pour responsable des limites liées au réseau Internet et en particulier de ses performances techniques et des temps de réponse pour consulter, interroger ou transférer des données. Vous prenez acte de ce que, lorsque vous utilisez le site de téléchargement et de consultation de la prestation, cela se fera à vos risques et périls. En outre, il vous appartient de prendre toutes mesures appropriées de nature à protéger vos propres données et logiciels de la contamination par d'éventuels "virus" informatiques ; MonSecretarIA ne pourra en aucun cas être tenus pour responsables d'éventuels dommages susceptibles d'en découler tels que pertes de données ou détérioration d'équipement informatique.
                  </p>
                  <p className="mb-4">
                    2. Dans certains pays, les lois en vigueur interdisent ou restreignent le libre accès à certaines œuvres de l'esprit ; vous vous engagez à vérifier qu'au regard de la loi du lieu de votre commande, il n'existe pas de semblables interdits ou restrictions concernant la prestation commandée. La responsabilité de MonSecretarIA ne pourra être engagée du fait du caractère illicite de la commande, du téléchargement/ consultation des fichiers numériques commandés et de l'usage que vous en faites.
                  </p>
                  <p className="mb-4">
                    3. MonSecretarIA ne pourra pas être tenue pour responsable d'un éventuel dysfonctionnement survenant au moment du téléchargement et de la consultation des fichiers numériques commandés et qui ne serait pas de leur fait (étant rappelé qu'il incombera au client d'établir la preuve de ce que ledit dysfonctionnement relève du fait de Mon-SecretarIA.com). Néanmoins, en cas de difficulté, MonSecretarIA s'engage à faire tous les efforts pour vous permettre d'accéder à la lecture des fichiers numériques commandés. En tout état de cause, l'étendue de la responsabilité de MonSecretarIA sera limitée à la valeur du service de téléchargement et de la consultation des fichiers numériques commandés et payés auxquels vous n'auriez pas pu avoir, sous réserve que vous soyez en mesure d'en rapporter la preuve.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 9. POLITIQUE DE CONFIDENTIALITÉ ET CGU (conditions générales d'utilisation)</h3>
                  <p className="mb-4">
                    Pour plus d'informations sur l'utilisation des données personnelles, les Utilisateurs doivent se référer à la politique de confidentialité de MonSecretarIA considérée comme faisant partie des présentes Conditions, au même titre que les CGU.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 10. PROPRIÉTÉ INTELLECTUELLE</h3>
                  <p className="mb-4">
                    Toutes les marques, nominales ou figuratives, appellations commerciales, marques de service, verbales, illustrations, images ou logos qui apparaissent sont, et demeurent, la propriété exclusive du Propriétaire ou de ses concédants et sont protégées par les lois en vigueur sur les marques et par les traités internationaux connexes.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 11. LIMITATIONS DE RESPONSABILITÉ</h3>
                  <p className="mb-4">
                    MonSecretarIA et toutes les fonctions accessibles via Mon-SecretarIA.com sont mises à la disposition des Utilisateurs conformément aux termes et conditions du Contrat, sans aucune garantie, expresse ou implicite, qui n'est pas requise par la loi. En particulier, il n'y a aucune garantie d'adéquation des services offerts pour les objectifs spécifiques de l'Utilisateur. MonSecretarIA et les fonctions accessibles via Mon-SecretarIA.com sont utilisées par les Utilisateurs à leurs risques et périls et sous leur propre responsabilité. Par conséquent, le propriétaire ne sera pas responsable de:
                  </p>
                  <p className="mb-4">
                    • Toute perte qui n'est pas une conséquence directe de la violation du Contrat par le Propriétaire;
                    <br />• Toute perte d'opportunités commerciales et toute autre perte, même indirecte, qui pourrait être encourue par l'Utilisateur (comme, mais sans s'y limiter, les pertes de trading, perte de revenus, revenus, bénéfices ou économies anticipées, perte de contrats ou de relations d'affaires) , perte de réputation ou de bonne volonté, etc.);
                    <br />• Dommages ou pertes résultant d'interruptions ou de dysfonctionnements de site.com dus à des cas de force majeure, ou au moins à des événements imprévus et imprévisibles et, en tout cas, indépendants de la volonté et étrangers au contrôle du Propriétaire, tels que: par exemple, mais sans s'y limiter, pannes ou perturbations de lignes téléphoniques ou électriques, Internet et / ou autres moyens de transmission, indisponibilité de sites internet, grèves, catastrophes naturelles, virus et cyber-attaques, interruptions de livraison de produits, tiers services ou applications;
                    <br />• Utilisation incorrecte ou inappropriée de Mon-SecretarIA.com par des utilisateurs ou des tiers.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 12. CHANGEMENTS DE CES TERMES</h3>
                  <p className="mb-4">
                    Le propriétaire se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs qui continuent d'utiliser Mon-SecretarIA.com après la publication des modifications acceptent les nouvelles conditions dans leur intégralité, sans effet rétroactif.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 13. CESSION DE CONTRAT</h3>
                  <p className="mb-4">
                    Le Propriétaire se réserve le droit de transférer, céder, céder par novation ou sous-traiter tout ou partie des droits ou obligations en vertu des présentes Conditions, tant que les droits de l'Utilisateur en vertu des Conditions ne sont pas affectés. 
                    <br />Les utilisateurs ne peuvent en aucun cas céder ou transférer leurs droits ou obligations en vertu des présentes conditions sans l'autorisation écrite du propriétaire.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 14. SERVICE CLIENTS</h3>
                  <p className="mb-4">
                    Pour toute information ou question, notre service clientèle est à votre disposition ;
                    <br />Adresse mail : contact.monsecretaria@gmail.com
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 15. LOI APPLICABLE</h3>
                  <p className="mb-4">
                    Le présent contrat est soumis à la loi française. La langue du présent contrat est la langue française. En cas de litige entre le professionnel et le consommateur, ceux-ci s'efforceront de trouver une solution amiable.
                    <br /> 
                    <br />A défaut d'accord amiable, le consommateur a la possibilité de saisir gratuitement le médiateur de la consommation dont relève le professionnel, à savoir AME CONSO, dans un délai d'un an à compter de la réclamation écrite adressée au professionnel.
                    <br /> 
                    <br />La saisine du médiateur de la consommation devra s'effectuer :
                    <br />soit en complétant le formulaire prévu à cet effet sur le site internet de l'AME CONSO : <a href="http://www.mediationconso-ame.com" className="text-blue-600 hover:underline">www.mediationconso-ame.com</a> ; 
                    <br />soit par courrier adressé à l'AME CONSO, 11 Place Dauphine – 75001 PARIS.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Conditions générales d'utilisation et des services proposés</h2>
                  <p className="text-sm text-gray-500 mb-6">14/05/25</p>
                  
                  <p className="mb-4">
                    Le site constitue une œuvre de l'esprit protégée par les dispositions du Code de la Propriété Intellectuelle et des Réglementations Internationales applicables.
                  </p>
                  
                  <p className="mb-4">
                    Le visiteur/acheteur ne peut en aucune manière réutiliser, céder ou exploiter pour son propre compte tout ou partie des éléments ou travaux du Site.
                  </p>
                  
                  <p className="mb-4">
                    L'utilisation du site MonSecretarIA implique l'acceptation pleine et entière des conditions générales d'utilisation ci-après décrites. Ces conditions d'utilisation sont susceptibles d'être modifiées ou complétées à tout moment, les utilisateurs du site MonSecretarIA sont donc invités à les consulter de manière régulière.
                  </p>
                  
                  <p className="mb-4">
                    Ce site internet est normalement accessible à tout moment aux utilisateurs. Une interruption pour raison de maintenance technique peut être toutefois décidée par MonSecretarIA, qui s'efforcera alors de communiquer préalablement aux utilisateurs les dates et heures de l'intervention.
                  </p>
                  
                  <p className="mb-4">
                    Le site MonSecretarIA est mis à jour régulièrement par le responsable. De la même façon, les mentions légales peuvent être modifiées à tout moment : elles s'imposent néanmoins à l'utilisateur qui est invité à s'y référer le plus souvent possible afin d'en prendre connaissance.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Description des services fournis</h3>
                  
                  <p className="mb-4">
                    Le site internet MonSecretarIA a pour objet de fournir une information concernant l'ensemble des activités de la société. MonSecretarIA s'efforce de fournir sur le site des informations aussi précises que possible. Toutefois, il ne pourra être tenu responsable des oublis, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
                  </p>
                  
                  <p className="mb-4">
                    Toutes les informations indiquées sur le site MonSecretarIA sont données à titre indicatif, et sont susceptibles d'évoluer. Par ailleurs, les renseignements figurant sur le site MonSecretarIA ne sont pas exhaustifs. Ils sont donnés sous réserve de modifications ayant été apportées depuis leur mise en ligne.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Nullité partielle</h3>
                  
                  <p className="mb-4">
                    Si une ou plusieurs stipulations des présentes CGU sont tenues pour non valides ou déclarées comme tel en application d'une loi, d'un règlement ou d'une décision définitive d'une juridiction compétente, les autres stipulations garderont toute leur force et toute leur portée.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Limitations contractuelles</h3>
                  
                  <p className="mb-4">
                    Le site est hébergé sur Netlify.
                    <br />Le site Internet ne pourra être tenu responsable de dommages matériels liés à l'utilisation du site. De plus, l'utilisateur du site s'engage à accéder au site en utilisant un matériel récent, ne contenant pas de virus et avec un navigateur de dernière génération mis-à-jour
                  </p>
                  
                  <p className="mb-4">
                    L'objectif est d'apporter une prestation qui assure le meilleur taux d'accessibilité. L'hébergeur assure la continuité de son service 24 Heures sur 24, tous les jours de l'année. Il se réserve néanmoins la possibilité d'interrompre le service d'hébergement pour les durées les plus courtes possibles notamment à des fins de maintenance, d'amélioration de ses infrastructures, de défaillance de ses infrastructures ou si les Prestations et Services génèrent un trafic réputé anormal.
                  </p>
                  
                  <p className="mb-4">
                    Le site et l'hébergeur ne pourront être tenus responsables en cas de dysfonctionnement du réseau Internet, des lignes téléphoniques ou du matériel informatique et de téléphonie lié notamment à l'encombrement du réseau empêchant l'accès au serveur.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Propriété intellectuelle et contrefaçons</h3>
                  
                  <p className="mb-4">
                    Le site est propriétaire des droits de propriété intellectuelle et détient les droits d'usage sur tous les éléments accessibles sur le site internet et la prestation, notamment les textes, images, graphismes, logos, vidéos, icônes et sons.
                  </p>
                  
                  <p className="mb-4">
                    Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site ou de la prestation, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de  MonSecretarIA
                  </p>
                  
                  <p className="mb-4">
                    Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Limitations de responsabilité</h3>
                  
                  <p className="mb-4">
                    MonSecretarIA agit en tant qu'éditeur du site et est responsable de la qualité et de la véracité du Contenu qu'il publie en tant que prestataire.
                  </p>
                  
                  <p className="mb-4">
                    Le site ne pourra être tenu responsable des dommages directs et indirects causés à l'utilisateur, lors de l'accès au site internet ou de la prestation, et résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications indiquées, soit de l'apparition d'un bug ou d'une incompatibilité, soit de la mise en pratique non encadrée du site ou de la prestation.
                    <br />MonSecretarIA ne pourra également être tenu responsable des dommages indirects (tels par exemple qu'une perte de marché ou perte d'une chance) consécutifs à l'utilisation du site ou de la prestation.
                    <br />Des espaces interactifs (possibilité de poser des questions) sont à la disposition des utilisateurs. MonSecretarIA se réserve le droit de supprimer, sans mise en demeure préalable, tout contenu déposé dans cet espace qui contreviendrait à la législation applicable en France, en particulier aux dispositions relatives à la protection des données. 
                  </p>
                  
                  <p className="mb-4">
                    Le cas échéant, MonSecretarIA se réserve également la possibilité de mettre en cause la responsabilité civile et/ou pénale de l'utilisateur, notamment en cas de message à caractère raciste, injurieux, diffamant, ou pornographique, quel que soit le support utilisé (texte, photographie …).
                  </p>
                  
                  <p className="mb-4">
                    MonSecretarIA ne peut garantir l'exactitude ou l'intégrité des contenus générés par les utilisateurs et se réserve le droit de supprimer tout contenu ne respectant pas les lois applicables, les présentes CGU ou la sécurité des autres utilisateurs.
                  </p>
                  
                  <p className="mb-4">
                    MonSecretarIA ne pourra également être tenu responsable des dommages indirects (tels par exemple qu'une perte de marché ou perte d'une chance) consécutifs à l'utilisation du site ou de la prestation.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Attribution de compétence et règlement des litiges</h3>
                  
                  <p className="mb-4">
                    Les présentes CGU et CGV sont soumises à l'application du droit français.
                    <br />Dans le cas où les présentes CGV sont traduites dans une langue étrangère, seul le texte français fait foi en cas de litige sur l'acception d'un terme ou d'une disposition des présentes. Les litiges susceptibles de naître entre MonSecretarIA et le Client feront l'objet d'une tentative de résolution amiable, avant toute action judiciaire.
                    <br />En cas de différend entre le Client et MonSecretarIA relatif aux CGV, le Client est informé que, conformément aux dispositions du Code de la consommation, MonSecretarIA a désigné un médiateur qu'il pourra contacter à l'adresse.
                    <br />A défaut d'accord amiable, le consommateur a la possibilité de saisir gratuitement le médiateur de la consommation dont relève le professionnel, à savoir AME CONSO, dans un délai d'un an à compter de la réclamation écrite adressée au professionnel. La saisine du médiateur de la consommation devra s'effectuer soit en complétant le formulaire prévu à cet effet sur le site internet de l'AME CONSO : <a href="http://www.mediationconso-ame.com" className="text-blue-600 hover:underline">www.mediationconso-ame.com</a> ; soit par courrier adressé à l'AME CONSO, 11 Place Dauphine – 75001 PARIS. 
                    <br />A l'issue de la médiation, le médiateur proposera une solution. Les parties restent libres d'accepter ou de refuser le recours à la médiation ainsi que, en cas de recours à la médiation, d'accepter ou de refuser la solution proposée par le médiateur. A défaut d'accord amiable, tout litige sera porté devant les juridictions relevant du siège social de MonSecretarIA, y compris en cas de pluralité de défendeurs, ceci étant expressément accepté par le Client.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Force majeure</h3>
                  
                  <p className="mb-4">
                    MonSecretarIA ne pourra être tenue responsable de la non-exécution ou du retard dans l'exécution de l'une de ses obligations découlant d'un cas de force majeure, au sens de l'article 1218 du Code civil. Seront considérés comme cas de force majeure tous faits ou circonstances irrésistibles extérieurs à MonSecretarIA, imprévisibles, inévitables, indépendants de la volonté de MonSecretarIA, et qui ne pourront être empêchés par cette dernière, malgré tous les efforts raisonnablement possibles. 
                  </p>
                  
                  <p className="mb-4">
                    Outre les cas retenus par la législation en vigueur et la jurisprudence française, sont considérés cas de force majeure, et ce sans exhaustivité, les événements suivants :
                    <br />Les blocages des réseaux et systèmes de communication
                    <br />Les grèves totales ou partielles, lock-out, boycottage ou événement similaire
                    <br />Les attaques de pirates informatiques.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Données personnelles</h3>
                  
                  <p className="mb-4">
                    L'utilisateur est informé que l'ensemble des données collectées dans le cadre du fonctionnement du Site, sont traitées par MonSecretarIA. Il est invité à se reporter à l'onglet « Politique de confidentialité » du Site pour obtenir toutes les informations relatives à ce point.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}