import Paymongo from 'paymongo';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY || '';

export interface PaymentIntentData {
  amount: number; // Amount in centavos (PHP * 100)
  currency: string;
  description: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  clientKey?: string;
  nextAction?: any;
  error?: string;
}

export interface PayoutData {
  amount: number; // Amount in centavos
  currency: string;
  description: string;
  destination: {
    type: string; // 'gcash', 'grabpay', 'bank'
    accountNumber: string;
    accountName: string;
  };
}

export class PaymongoService {
  private client: any;

  constructor() {
    if (PAYMONGO_SECRET_KEY) {
      this.client = new Paymongo(PAYMONGO_SECRET_KEY);
    }
  }

  // Create a checkout session (hosted payment page) for deposits
  async createCheckoutSession(data: PaymentIntentData): Promise<PaymentResult> {
    try {
      if (!PAYMONGO_SECRET_KEY) {
        throw new Error('PayMongo not configured. Please set PAYMONGO_SECRET_KEY');
      }

      // Use direct HTTP request to PayMongo API for checkout sessions
      const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              line_items: [{
                name: 'VeriFund PUSO Deposit',
                quantity: 1,
                amount: data.amount,
                currency: data.currency,
                description: data.description,
              }],
              payment_method_types: ['gcash', 'card'],
              success_url: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/payment/success`,
              cancel_url: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/payment/cancel`,
              description: data.description,
              metadata: data.metadata || {},
              reference_number: `DEP_${Date.now()}`,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('PayMongo API Error:', response.status, errorData);
        throw new Error(`PayMongo API Error: ${response.status} ${errorData}`);
      }

      const checkoutSession = await response.json();
      console.log('PayMongo Checkout Session Response:', JSON.stringify(checkoutSession, null, 2));

      return {
        id: checkoutSession.data.id,
        status: 'created',
        amount: data.amount,
        currency: data.currency,
        clientKey: checkoutSession.data.attributes.checkout_url,
        nextAction: {
          redirect: {
            url: checkoutSession.data.attributes.checkout_url
          }
        },
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        id: '',
        status: 'failed',
        amount: 0,
        currency: 'PHP',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Attach payment method to payment intent
  async attachPaymentMethod(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      if (!this.client) {
        throw new Error('PayMongo not configured');
      }

      const result = await this.client.paymentIntents.attach(paymentIntentId, {
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: paymentIntentId, // This should be the client key
          },
        },
      });

      return {
        id: result.data.id,
        status: result.data.attributes.status,
        amount: result.data.attributes.amount,
        currency: result.data.attributes.currency,
        paymentMethod: result.data.attributes.payment_method?.type,
        nextAction: result.data.attributes.next_action,
      };
    } catch (error) {
      console.error('Error attaching payment method:', error);
      return {
        id: paymentIntentId,
        status: 'failed',
        amount: 0,
        currency: 'PHP',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Create a source for GCash/GrabPay payments
  async createSource(
    amount: number,
    type: 'gcash' | 'grabpay',
    description: string,
    redirectUrl: string
  ): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('PayMongo not configured');
      }

      const source = await this.client.sources.create({
        data: {
          attributes: {
            amount,
            currency: 'PHP',
            type,
            description,
            redirect: {
              success: redirectUrl,
              failed: redirectUrl,
            },
          },
        },
      });

      return source.data;
    } catch (error) {
      console.error('Error creating source:', error);
      throw error;
    }
  }

  // Get payment intent details
  async getPaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('PayMongo not configured');
      }

      const paymentIntent = await this.client.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.data;
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  // Create a payout for withdrawals
  async createPayout(data: PayoutData): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('PayMongo not configured');
      }

      // Note: Payouts require additional setup and approval from PayMongo
      // This is a placeholder implementation
      const payout = await this.client.payouts.create({
        data: {
          attributes: {
            amount: data.amount,
            currency: data.currency,
            description: data.description,
            // destination: data.destination, // This depends on PayMongo's payout API
          },
        },
      });

      return payout.data;
    } catch (error) {
      console.error('Error creating payout:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return signature === computedSignature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  // Get supported payment methods
  getSupportedPaymentMethods(): string[] {
    return [
      'gcash',
      'grabpay', 
      'paymaya',
      'card',
      'dob',
      'dob_ubp',
      'billease',
    ];
  }

  // Convert PHP to centavos (PayMongo uses centavos)
  phpToCentavos(phpAmount: number): number {
    return Math.round(phpAmount * 100);
  }

  // Convert centavos to PHP
  centavosToPhp(centavos: number): number {
    return centavos / 100;
  }
}

export const paymongoService = new PaymongoService();