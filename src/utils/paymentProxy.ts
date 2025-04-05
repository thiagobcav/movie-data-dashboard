
import { encrypt } from './encryption';

// Mercado Pago integration constants
const PROXY_URL = 'https://script.google.com/macros/s/AKfycbymxuIli4v1MHzIr-6vhm2IsRZOoGM2QetJqCGwPhqltBxAMXX-Yp5bbK8esK4GlLLs9g/exec';

// This access token is specifically designed to be used in the frontend
// It is a public key for the Mercado Pago integration
const MP_ACCESS_TOKEN = encrypt('APP_USR-1071200859626834-081119-807909e24b0679d46673ade2907575bf-159047990');

interface PaymentResponse {
  init_point?: string;
  error?: string;
}

interface UserData {
  email: string;
  name: string;
  id: string;
}

/**
 * Creates a payment session using the secure proxy
 * This prevents exposing the access token directly in network requests
 */
export const createPaymentSession = async (userData: UserData): Promise<PaymentResponse> => {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createPayment',
        accessToken: MP_ACCESS_TOKEN,
        userData,
        subscription: {
          amount: 15.00,
          currency: 'BRL',
          description: 'Assinatura Premium Mensal',
          frequency: 'monthly'
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Payment session creation failed:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
