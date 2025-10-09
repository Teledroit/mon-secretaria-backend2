export interface TwilioCredentialStatus {
  isValid: boolean;
  isTestAccount: boolean;
  canPurchaseNumbers: boolean;
  message?: string;
  upgradeRequired?: boolean;
}

export async function validateTwilioCredentials(
  accountSid: string,
  authToken: string
): Promise<TwilioCredentialStatus> {
  try {
    if (!accountSid || !authToken) {
      return {
        isValid: false,
        isTestAccount: false,
        canPurchaseNumbers: false,
        message: 'Identifiants Twilio manquants',
      };
    }

    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      return {
        isValid: false,
        isTestAccount: false,
        canPurchaseNumbers: false,
        message: errorData.message || 'Identifiants Twilio invalides',
      };
    }

    const accountData = await response.json();

    const isTestAccount = accountData.status === 'trial' ||
                          accountData.type === 'Trial' ||
                          accountSid.startsWith('AC') && accountData.status !== 'active';

    return {
      isValid: true,
      isTestAccount,
      canPurchaseNumbers: !isTestAccount && accountData.status === 'active',
      message: isTestAccount
        ? 'Compte Twilio en mode test - mise à niveau requise pour acheter des numéros'
        : 'Compte Twilio valide',
      upgradeRequired: isTestAccount,
    };

  } catch (error) {
    console.error('Error validating Twilio credentials:', error);
    return {
      isValid: false,
      isTestAccount: false,
      canPurchaseNumbers: false,
      message: 'Impossible de valider les identifiants Twilio',
    };
  }
}

export function isTestAccountError(error: any): boolean {
  if (error?.response?.status === 403) {
    return true;
  }

  if (error?.response?.data?.code === 20008) {
    return true;
  }

  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('test account') ||
    errorMessage.includes('trial account') ||
    errorMessage.includes('upgrade') ||
    errorMessage.includes('20008')
  );
}
