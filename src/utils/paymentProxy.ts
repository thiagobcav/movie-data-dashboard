
import { encrypt } from './encryption';
import { toast } from 'sonner';
import logger from './logger';

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
    logger.info('Creating payment session for user:', userData.email);
    
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
    
    // First check if response was ok (HTTP 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Payment API error (${response.status}):`, errorText);
      
      // Try to parse the error as JSON if possible
      try {
        const errorJson = JSON.parse(errorText);
        return { error: errorJson.error || errorJson.message || `HTTP error ${response.status}` };
      } catch (e) {
        // If not valid JSON, return the raw text
        return { error: errorText || `HTTP error ${response.status}` };
      }
    }
    
    // Check content type to ensure we're getting JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const rawResponse = await response.text();
      logger.error('Payment API returned non-JSON response:', rawResponse);
      return { error: 'Resposta inválida do servidor de pagamento' };
    }
    
    // Parse the JSON response
    const data = await response.json();
    logger.info('Payment session created successfully:', data.init_point ? 'Init point received' : 'No init point');
    
    // Validate the parsed response
    if (!data || (typeof data !== 'object')) {
      return { error: 'Formato de resposta inválido' };
    }
    
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Payment session creation failed:', error);
    toast.error('Erro ao criar sessão de pagamento', { 
      description: errorMessage 
    });
    return { error: errorMessage };
  }
};
