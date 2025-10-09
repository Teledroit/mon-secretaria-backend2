import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
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
              Politique de confidentialité
            </h1>
            
            <p className="text-sm text-gray-500 text-center mb-6">14/05/25</p>

            <div className="prose prose-gray max-w-none">
              <p className="mb-4">
                La protection de vos données personnelles est notre plus grande priorité, c'est pourquoi nous n'utilisons vos données que dans le strict respect des principes de protection des données applicables. Depuis le 25 mai 2018, les dispositions du Règlement général sur la protection des données de l'UE (ci-après dénommé RGPD) s'applique dans toute l'Europe.
              </p>
              
              <p className="mb-4">
                Nous ne vendons ni ne louons vos données à des tiers et nous aimerions vous informer en détail sur la manière dont nous traitons les données à caractère personnel conformément audit Règlement (cf. Article 13 et suivants du RGPD).
              </p>
              
              <p className="mb-6">
                Nous nous réservons le droit de modifier la présente politique de confidentialité à tout moment, donc veuillez s'il vous plaît la consulter fréquemment. Les changements et les clarifications prendront effet immédiatement après leur publication. Si nous apportons des changements au contenu de cette politique, nous vous aviserons ici dans les moyens possibles qu'elle a été mise à jour, pour que vous sachiez quels renseignements nous recueillons, la manière dont nous les utilisons, et dans quelles circonstances nous les divulguons, s'il y a lieu de le faire.
              </p>

              <hr className="my-8" />

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 1 – RENSEIGNEMENTS PERSONNELS RECUEILLIS</h2>
              
              <p className="mb-4">
                En tant qu'utilisateur, vous pouvez accéder à certains Services sans avoir à créer de compte ou à vous connecter. Lorsque vous effectuez une utilisation ou un achat dans le cadre de notre processus d'achat et de vente, nous recueillons les renseignements personnels que vous nous fournissez, tels que votre nom complet, adresse de facturation, informations d'entreprise, numéro de téléphone, paramètres d'application (instructions pdf, historique des appels) et adresse mail. Les données sont protégées par des politiques de sécurité (Row Level Security) pour garantir que chaque utilisateur n'accède qu'à ses propres données.
              </p>
              
              <p className="mb-4">
                Voici la liste complète des informations disponibles : 
                <br />1. Historique des appels :
                <br />Date et heure de début/fin
                <br />Durée de l'appel
                <br />Numéro de téléphone appelant
                <br />Statut de l'appel (en cours, terminé, manqué)
                <br />Coût de l'appel
                <br />Horodatage de création
                <br />2. Transcriptions des conversations :
                <br />Transcription complète des échanges
                <br />Horodatage pour chaque message
                <br />Identification du locuteur (client ou assistant)
                <br />Analyse du sentiment pour chaque message
                <br />Lien avec l'appel correspondant
                <br />3. Statistiques et analyses :
                <br />Taux de conversion
                <br />Durée moyenne des appels
                <br />Nombre d'appels par période
                <br />Tendances des sentiments
                <br />Motifs d'appels fréquents
                <br />Toutes ces informations sont accessibles via le tableau de bord avec :
                <br />Des filtres pour rechercher des appels spécifiques
                <br />Une vue détaillée de chaque appel avec la transcription complète
                <br />Des graphiques et statistiques pour analyser les tendances
                <br />La possibilité d'exporter les données
              </p>
              
              <p className="mb-4">
                Lorsque vous naviguez sur notre site, nous recevons également automatiquement l'adresse de protocole Internet (adresse IP) de votre ordinateur, qui nous permet d'obtenir plus de détails au sujet du navigateur, de l'appareil et du système d'exploitation que vous utilisez.
              </p>
              
              <p className="mb-4">
                Marketing par e-mail (le cas échéant): Avec votre permission, nous pourrions vous envoyer des e-mails au sujet de notre site, de nouveaux produits et d'autres mises à jour.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 2 - CONSENTEMENT</h2>
              
              <p className="mb-4">
                Comment obtenez-vous mon consentement?
              </p>
              
              <p className="mb-4">
                Lorsque vous nous fournissez vos renseignements personnels ou professionnels pour conclure une transaction, vérifier votre carte de crédit, passer une commande, planifier une livraison ou retourner un achat, nous présumons que vous consentez à ce que nous recueillions vos renseignements et vous assurez de leurs véracités.
                <br />Si nous vous demandons de nous fournir vos renseignements personnels pour une autre raison que celles indiquées ci-dessus, à des fins de marketing par exemple, nous vous demanderons directement votre consentement explicite, ou nous vous donnerons la possibilité de refuser.
              </p>
              
              <p className="mb-4">
                Comment puis-je retirer mon consentement?
              </p>
              
              <p className="mb-4">
                Vos choix :
                <br />Vous disposez d'un certain contrôle sur la manière dont vos données personnelles sont utilisées. Toutefois, veuillez noter que refuser de fournir certaines données peut affecter l'utilisation de certaines fonctionnalités de nos services. 
                <br />Voici vos options principales :
                <br />Gestion du compte utilisateur : Vous pouvez accéder à votre compte à tout moment pour modifier ou mettre à jour vos informations personnelles dans la section "Mon profil". Nous ne recueillons que les informations nécessaires pour fournir nos services. 
                <br />Communication marketing : Vous pouvez vous désinscrire des communications marketing en cliquant sur le lien "Se désabonner" présent dans nos courriels ou en nous contactant directement. Cependant, nous continuerons à vous envoyer des messages liés aux opérations de votre compte. 
                <br />Paramètres des cookies : Vous avez la possibilité de configurer votre navigateur pour gérer ou désactiver les cookies. Notez que cela peut limiter certaines fonctionnalités de notre site. Veuillez consulter notre Politique en matière de cookies pour plus de détails. 
                <br />Vos droits :
                <br />Conformément au RGPD et aux lois applicables, vous bénéficiez des droits suivants concernant vos données personnelles :
                <br />1. Accès aux données : Vous avez le droit de demander une copie de vos données personnelles que nous détenons. 
                <br />2. Rectification : Vous pouvez demander la correction d'informations inexactes ou incomplètes. 
                <br />3. Effacement : Vous avez le droit de demander la suppression de vos données personnelles, sous réserve des obligations légales. 
                <br />4. Limitation du traitement : Vous pouvez restreindre le traitement de vos données dans certaines circonstances. 
                <br />5. Opposition : Vous pouvez vous opposer au traitement de vos données personnelles, notamment pour des raisons de marketing direct. 
                <br />6. Portabilité : Vous pouvez demander que vos données soient transmises à vous ou à un autre prestataire dans un format structuré et couramment utilisé. 
                <br />7. Directives post-mortem : Vous pouvez nous donner des instructions sur la gestion de vos données personnelles après votre décès. 
              </p>
              
              <p className="mb-4">
                Si après nous avoir donné votre consentement, vous changez d'avis et ne consentez plus à ce que nous puissions vous contacter, recueillir vos renseignements ou les divulguer, vous pouvez nous en aviser en nous contactant à contact.monsecretaria@gmail.com ou par courrier à: Flamant Mode, 178 rue du marechal leclerc 94410 St Maurice, France
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 3 – DIVULGATION</h2>
              
              <p className="mb-4">
                Nous pouvons divulguer vos renseignements personnels si la loi nous oblige à le faire ou si vous violez nos Conditions Générales de Vente et d'Utilisation.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 4 – HEBERGEUR</h2>
              
              <p className="mb-4">
                Notre site est hébergé sur Netlify. Ils nous fournissent la plate-forme en ligne qui nous permet de vous mettre en relation avec des entreprises qui vendent leurs services.
                <br />Vos données sont stockées dans le système de stockage de données et les bases de données de Supabase, et dans l'application générale de Supabase. Vos données sont conservées sur un serveur sécurisé protégé par un pare-feu.
              </p>
              
              <p className="mb-4">
                Paiements via fournisseurs externes:
              </p>
              
              <p className="mb-4">
                Si vous réalisez votre achat par le biais d'une passerelle de paiement direct, dans ce cas Stripe stockera vos renseignements de carte de crédit. Ces renseignements sont chiffrés conformément à la norme de sécurité des données établie par l'industrie des cartes de paiement (norme PCI-DSS). Les renseignements relatifs à votre transaction d'achat sont conservés aussi longtemps que nécessaire pour finaliser votre commande. Une fois votre commande finalisée, les renseignements relatifs à la transaction d'achat sont supprimés.
              </p>
              
              <p className="mb-4">
                Toutes les passerelles de paiement direct respectent la norme PCI-DSS, gérée par le conseil des normes de sécurité PCI, qui résulte de l'effort conjoint d'entreprises telles que Visa, MasterCard, American Express et Discover.
              </p>
              
              <p className="mb-4">
                Les exigences de la norme PCI-DSS permettent d'assurer le traitement sécurisé des données de cartes de crédit par notre boutique et par ses prestataires de services.
                <br />Pour plus d'informations, veuillez consulter les Conditions d'Utilisation de Stripe ou leur Politique de Confidentialité.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 5 – SERVICES FOURNIS PAR DES TIERS</h2>
              
              <p className="mb-4">
                De manière générale, les fournisseurs tiers que nous utilisons vont uniquement recueillir, utiliser et divulguer vos renseignements dans la mesure du nécessaire pour pouvoir réaliser les services qu'ils nous fournissent.
              </p>
              
              <p className="mb-4">
                Cependant, certains tiers fournisseurs de services, comme les passerelles de paiement et autres processeurs de transactions de paiement, possèdent leurs propres politiques de confidentialité quant aux renseignements que nous sommes tenus de leur fournir pour vos transactions d'achat.
                <br />En ce qui concerne ces fournisseurs, nous vous recommandons de lire attentivement leurs politiques de confidentialité pour que vous puissiez comprendre la manière dont ils traiteront vos renseignements personnels.
              </p>
              
              <p className="mb-4">
                Il ne faut pas oublier que certains fournisseurs peuvent être situés ou avoir des installations situées dans une juridiction différente de la vôtre ou de la nôtre. Donc si vous décidez de poursuivre une transaction qui requiert les services d'un fournisseur tiers, vos renseignements pourraient alors être régis par les lois de la juridiction dans laquelle ce fournisseur se situe ou celles de la juridiction dans laquelle ses installations sont situées. 
                <br />À titre d'exemple, si vous êtes situé au Canada et que votre transaction est traitée par une passerelle de paiement située aux États-Unis, les renseignements vous appartenant qui ont été utilisés pour conclure la transaction pourraient être divulgués en vertu de la législation des États-Unis, y compris le Patriot Act.
                <br />Une fois que vous quittez le site ou que vous êtes redirigé vers le site web ou l'application d'un tiers, vous n'êtes plus régi par la présente Politique de Confidentialité ni par les Conditions Générales de Vente et d'Utilisation de notre site web.
              </p>
              
              <p className="mb-4">
                Liens
              </p>
              
              <p className="mb-4">
                Vous pourriez être amené à quitter notre site web en cliquant sur certains liens présents sur notre site. Nous n'assumons aucune responsabilité quant aux pratiques de confidentialité exercées par ces autres sites et vous recommandons de lire attentivement leurs politiques de confidentialité.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 6 – SÉCURITÉ</h2>
              
              <p className="mb-4">
                Pour protéger vos données personnelles, nous prenons des précautions raisonnables et suivons les meilleures pratiques de l'industrie pour nous assurer qu'elles ne soient pas perdues, détournées, consultées, divulguées, modifiées ou détruites de manière inappropriée.
              </p>
              
              <p className="mb-4">
                Si vous nous fournissez vos informations de carte de crédit, elles seront chiffrées par le biais de l'utilisation du protocole de sécurisation SSL et conservées avec un chiffrement de type AES-256. Bien qu'aucune méthode de transmission sur Internet ou de stockage électronique ne soit sûre à 100%, nous suivons toutes les exigences de la norme PCI-DSS et mettons en œuvre des normes supplémentaires généralement reconnues par l'industrie.
                <br />L'utilisateur inscrivant son numéro de téléphone peut effectuer à tout moment une demande au site pour s'inscrire sur la liste d'opposition au démarchage téléphonique (dispositif BLOCTEL). Tout consommateur a la possibilité de s'inscrire gratuitement sur la liste d'opposition au démarchage téléphonique BLOCTEL https://conso.bloctel.fr/index.php/inscription.php
                <br />Conformément à la loi n° 2020-901 du 24 juillet 2020 visant à encadrer le démarchage téléphonique et à lutter contre les appels frauduleux, tout professionnel se réserve le droit de démarcher un consommateur inscrit sur la liste d'opposition au démarchage téléphonique lorsqu'il s'agit de sollicitations intervenant dans le cadre de l'exécution d'un contrat en cours et ayant un rapport avec l'objet dudit contrat, y compris lorsqu'il s'agit de proposer au consommateur des produits ou services afférents ou complémentaires à l'objet du contrat en cours ou de nature à améliorer ses performances ou sa qualité.
                <br />Elles sont conservées pendant toute la durée de la relation des présentes et pendant une durée maximale de cinq ans après la fin de la relation contractuelle selon les obligations légales d'archivage et de conservation et sont destinées au site et à ses prestataires de services intervenant dans le cadre des relations contractuelles entre le site et le client.
              </p>
              
              <p className="mb-4">
                Le Client peut exercer à tout moment son droit d'accès aux données le concernant, les faire rectifier, effacer, limiter, porter, s'opposer à leur traitement ou à faire l'objet d'une décision fondée exclusivement sur un traitement, et peut donner des directives sur le traitement de ses données après son décès, en se connectant sur son compte ou en contactant le service clients contact.monsecretaria@gmail.com 
              </p>
              
              <p className="mb-4">
                MonSecretarIA collecte sur le Site des données personnelles concernant ses Clients, afin de traiter les Commandes passées sur le Site, analyser les Commandes, répondre à ses demandes de renseignement et, si le Client a expressément choisi cette option, lui envoyer des newsletters, sauf si le Client ne souhaite plus recevoir de telles communications de la part de MonSecretarIA. 
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">FICHIERS TÉMOINS COOKIES</h3>
              
              <p className="mb-4">
                Vous avez le choix de configurer votre navigateur pour accepter tous les cookies, rejeter tous les cookies, vous informer quand un cookie est émis, sa durée de validité et son contenu, ainsi que vous permettre de refuser son enregistrement dans votre terminal, et supprimer vos cookies périodiquement.
                <br />Vous pouvez paramétrer votre navigateur Internet pour désactiver les cookies. Notez toutefois que si vous désactivez les cookies, votre nom d'utilisateur ainsi que votre mot de passe ne seront plus sauvegardés sur aucun site web. 
              </p>
              
              <p className="mb-4">
                Comment configurer votre navigateur
                <br />Firefox :
                <br />1. Ouvrez Firefox
                <br />2. Appuyez sur la touche « Alt »
                <br />3. Dans le menu en haut de la page cliquez sur « Outils » puis « Options »
                <br />4. Sélectionnez l'onglet « Vie privée »
                <br />5. Dans le menu déroulant à droite de « Règles de conservation », cliquez sur « utiliser les paramètres personnalisés pour l'historique »
                <br />6. Un peu plus bas, décochez « Accepter les cookies »
                <br />7. Sauvegardez vos préférences en cliquant sur « OK »
                <br />Internet Explorer :
                <br />1. Ouvrez Internet Explorer
                <br />2. Dans le menu « Outils », sélectionnez « Options Internet »
                <br />3. Cliquez sur l'onglet « Confidentialité »
                <br />4. Cliquez sur « Avancé » et décochez « Accepter »
                <br />5. Sauvegardez vos préférences en cliquant sur « OK »
                <br />Google Chrome :
                <br />1. Ouvrez Google Chrome
                <br />2. Cliquez sur l'icône d'outils dans la barre de menu
                <br />3. Sélectionnez « Options »
                <br />4. Cliquez sur l'onglet « Options avancées »
                <br />5. Dans le menu déroulant « Paramètres des cookies », sélectionnez « Bloquer tous les cookies »
                <br />Safari :
                <br />1. Ouvrez Safari
                <br />2. Dans la barre de menu en haut, cliquez sur « Safari », puis « Préférences »
                <br />3. Sélectionnez l'icône « Sécurité »
                <br />4. À côté de « Accepter les cookies », cochez « Jamais »
                <br />5. Si vous souhaitez voir les cookies qui sont déjà sauvegardés sur votre ordinateur, cliquez sur « Afficher les cookies »
                <br />Voici une liste non exhaustive de fichiers témoins que nous utilisons. Nous les avons énumérés ici pour que vous ayez la possibilité de choisir si vous souhaitez les autoriser ou non.
              </p>
              
              <p className="mb-4">
                _session_id, identificateur unique de session, permet à Google de stocker les informations relatives à votre session (référent, page de renvoi, etc.).
              </p>
              
              <p className="mb-4">
                _Google_visit, aucune donnée retenue, persiste pendant 30 minutes depuis la dernière visite. Utilisé par le système interne de suivi des statistiques du fournisseur de notre site web pour enregistrer le nombre de visites.
              </p>
              
              <p className="mb-4">
                _Google_uniq, aucune donnée retenue, expire à minuit (selon l'emplacement du visiteur) le jour suivant. Calcule le nombre de visites par client unique.
              </p>
              
              <p className="mb-4">
                _secure_session_id, identificateur unique de session
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 7 – ÂGE DE CONSENTEMENT</h2>
              
              <p className="mb-4">
                En utilisant ce site, vous déclarez que vous avez au moins l'âge de la majorité dans votre État ou province de résidence, et que vous nous avez donné votre consentement pour permettre à toute personne d'âge mineur à votre charge d'utiliser ce site web.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 8 – MODIFICATIONS APPORTÉES À LA PRÉSENTE POLITIQUE DE CONFIDENTIALITÉ</h2>
              
              <p className="mb-4">
                Nous nous réservons le droit de modifier la présente politique de confidentialité à tout moment, donc veuillez s'il vous plaît la consulter fréquemment. Les changements et les clarifications prendront effet immédiatement après leur publication sur le site web. Si nous apportons des changements au contenu de cette politique, nous vous aviserons ici qu'elle a été mise à jour, pour que vous sachiez quels renseignements nous recueillons, la manière dont nous les utilisons, et dans quelles circonstances nous les divulguons, s'il y a lieu de le faire.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">ARTICLE 9 – RESPONSABILITÉ</h2>
              
              <p className="mb-4">
                Alors que nous avons effectué toutes les démarches pour nous assurer de la fiabilité des informations contenues sur ce site internet, MonSecretarIA ne peut encourir aucune responsabilité du fait d'erreurs, d'omissions, ou pour les résultats qui pourraient être obtenus par l'usage de ces informations. 
                <br />En utilisant le site, vous déclarez que vous avez au moins l'âge de la majorité dans votre État ou province de résidence, et que vous nous avez donné votre consentement pour permettre à toute personne d'âge mineur à votre charge d'utiliser cette application.
                <br />MonSecretarIA n'est tenu que d'une obligation de moyens concernant les informations qu'il met à disposition des personnes qui accèdent à son site internet. Par ailleurs, l'usage de liens hypertextes peut conduire votre consultation de notre site vers d'autres serveurs, serveurs sur lesquels MonSecretarIA n'a aucun contrôle.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 9.1 – COMMENTAIRES</h3>
              
              <p className="mb-4">
                Il est entendu que vous nous adressez vos commentaires à titre gracieux et que leur mise en ligne ne donne donc droit à aucune rémunération, ce que vous acceptez expressément.
                <br />Le commentaire publié sur MonSecretarIA reste votre seule et entière propriété.
                <br />Sans préjudice de ce qui précède et afin que votre commentaire puisse être mis en ligne sur le site, vous concédez à MonSecretarIA les autorisations nécessaires permettant les exploitations suivantes :
                <br />La reproduction de votre commentaire en tout ou partie, son intégration et sa communication au public sur le site, accompagnée ou non d'autres textes et/ou contenus, ainsi que sa communication au public par tous vecteurs ou support de communication connu on inconnu à ce jour.
                <br />Les droits d'adaptation, pour les besoins de l'exercice des droits visés ci-dessus.
                <br />Cette cession est délivrée à titre gratuit, pour le monde entier et pour toute la durée de la protection légale à compter de la date de mise en ligne du contenu sur le site. Les commentaires sont susceptibles d'être diffusées par MonSecretarIA, sur n'importe quelle page du site.
                <br />Il est précisé que si MonSecretarIA a le moindre doute sur le fait que vous n'ayez pas nécessairement toutes les autorisations utiles à la publication de votre commentaire, MonSecretarIA pourra vous demander tout justificatif et suspendre ce commentaire dans l'attente de votre réponse. MonSecretarIA peut référencer tout ou partie de votre commentaire afin de faciliter la gestion du stockage et de l'accès à celui-ci. Par ailleurs, compte tenu de la nature interactive d'Internet, vous êtes informés du fait que votre commentaire peut être présentée dans différents contextes, associée à d'autres œuvres, faire l'objet d'exploitations partielles, et vous déclarez l'accepter.
                <br />MonSecretarIA  se réserve la possibilité et le droit de re-publier votre commentaire sur tout autre service ou support exploité par MonSecretarIA, qu'il soit imprimé ou numérique. Il est entendu que cette nouvelle parution ne donne droit à aucune rémunération, ce que vous acceptez expressément.
                <br />Le choix de validation d'un commentaire est laissé à l'entière appréciation du responsable du site MonSecretarIA. Les commentaires pourront être modifiés et/ou corrigés pour une meilleure compréhension des visiteurs (orthographe, syntaxe, publicité abusive, etc).
                <br />L'internaute peut signer librement son commentaire de son nom ou pseudo ou nom de son entreprise ; les grossièretés seront effacées. L'administrateur ou toute personne de l'équipe (modérateur) pourra supprimer un lien qui ne conviendrait pas à la ligne éditoriale (sites pornographiques ou assimilés, sites promettant le gain d'argent facile, arnaques, scams, contrefaçon, incitation au piratage, voyance, site de jeux d'argent, casinos, etc…).
                <br />Un lien de signature peut aussi ne pas apparaitre, car il a été jugé que le commentaire n'apportait pas réellement de complément intéressant pour l'article. Ceci, même si le commentaire est publié. Dans le cas d'abus de la part d'un visiteur, ce dernier pourra voir son IP bannie et mise en liste noir et perdra alors la possibilité de commenter sur le site.
              </p>
              
              <p className="mb-4">
                Plusieurs cas peuvent se présenter et amener à ce que votre commentaire soit modéré :
                <br />Il a été automatiquement détecté comme spam puis supprimé dans les 24 heures
                <br />Il n'apporte rien à l'article et n'est pas utile pour les internautes
                <br />Si vous commentez uniquement pour gagner un backlink (lien retour SEO), vous n'êtes pas au bon endroit
                <br />Il est truffé de fautes d'orthographe ou écrit dans un français incompréhensible
                <br />Le mail indiqué est faux ou non valide
                <br />Il est jugé diffamatoire pour un tiers ou contient des propos illicites ou insultants.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">ARTICLE 9.2 – COMPORTEMENTS</h3>
              
              <p className="mb-4">
                Lorsque vous soumettez votre commentaire, vous reconnaissez et acceptez les conditions suivantes :
                <br />1. a) Vous êtes le propriétaire ou le titulaire des droits et/ou autorisations nécessaires relatifs aux droits d'auteur ou autres droits de propriété intellectuelle et/ou industrielle éventuellement attachés à votre commentaire. Vous autorisez MonSecretarIA à utiliser ce commentaire selon les termes énoncés dans les présentes Conditions d'Utilisation.
                <br />2. b) Vous bénéficiez de l'autorisation préalable et écrite de chaque personne physique identifiable dans votre commentaire pour utiliser leur nom et/ou leur image et/ou leur voix notamment, aux fins de leur diffusion en vue d'une utilisation conforme aux termes énoncés dans les présentes CGU. Vous disposez de manière générale de toute autorisation de quelque sorte que ce soit au titre du commentaire.
                <br />3. c) Vous ne devez pas transmettre de commentaire comportant de quelconques éléments illégaux, à savoir et notamment des contenus racistes, antisémites, injurieux, abusifs, constitutifs de harcèlement, diffamatoires et, de manière générale, Vous vous engagez à respecter l'ordre public et le droit des tiers.
                <br />A défaut de respecter les obligations précitées, MonSecretarIA se réserve le droit de suspendre à tout moment la publication de tout commentaire. A défaut de justification probante démontrant que l'utilisateur se conforme aux dispositions des présentes CGU, MonSecretarIA se réserve la faculté sans préavis de supprimer tout commentaire.
                <br />Vous pouvez parfaitement, s'agissant des seuls commentaires, nous notifier toute difficulté à leur propos conformément aux dispositions édictées dans la Loi n° 2004 – 575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique, notamment en son article 6.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-3">QUESTIONS ET COORDONNÉES</h2>
              
              <p className="mb-4">
                Si vous souhaitez: accéder à, corriger, modifier ou supprimer toute information personnelle que nous avons à votre sujet, déposer une plainte, ou si vous souhaitez simplement avoir plus d'informations, contactez notre agent responsable des normes de confidentialité à contact.monsecretaria@gmail.com ou par courrier à MonSecretarIA.
              </p>
              
              <p className="mb-4">
                [Flamant Mode, 178 rue du marechal leclerc, St Maurice, 94410, France]
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}