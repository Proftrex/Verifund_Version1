import { db } from '../db';
import { exchangeRates, transactions } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface ConversionQuote {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  fee: number;
  totalCost: number; // fromAmount + fee
}

export interface ConversionFees {
  conversionFeePercent: number; // 0.5% = 0.005
  platformFeeFlat: number; // ₱10 flat fee
  minimumFee: number; // ₱5 minimum
}

export class ConversionService {
  private defaultFees: ConversionFees = {
    conversionFeePercent: 0.005, // 0.5%
    platformFeeFlat: 10, // ₱10
    minimumFee: 5, // ₱5
  };

  // Get current exchange rate between currencies
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    try {
      // Get the latest active exchange rate
      const [rate] = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromCurrency, fromCurrency),
            eq(exchangeRates.toCurrency, toCurrency),
            eq(exchangeRates.isActive, true)
          )
        )
        .orderBy(desc(exchangeRates.createdAt))
        .limit(1);

      if (rate) {
        return parseFloat(rate.rate);
      }

      // Default rate if not found (1:1 for PHP to PUSO)
      if (fromCurrency === 'PHP' && toCurrency === 'PUSO') {
        return 1.0;
      }
      if (fromCurrency === 'PUSO' && toCurrency === 'PHP') {
        return 1.0;
      }

      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      throw error;
    }
  }

  // Calculate conversion quote including fees
  async getConversionQuote(
    fromAmount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionQuote> {
    try {
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      
      // Calculate base conversion amount
      const baseToAmount = fromAmount * exchangeRate;
      
      // Calculate fees
      const conversionFee = Math.max(
        fromAmount * this.defaultFees.conversionFeePercent,
        this.defaultFees.minimumFee
      );
      const platformFee = this.defaultFees.platformFeeFlat;
      const totalFee = conversionFee + platformFee;
      
      // Final amounts
      const totalCost = fromAmount + totalFee;
      const finalToAmount = baseToAmount; // Fees are deducted from input, not output
      
      return {
        fromAmount,
        fromCurrency,
        toAmount: finalToAmount,
        toCurrency,
        exchangeRate,
        fee: totalFee,
        totalCost,
      };
    } catch (error) {
      console.error('Error calculating conversion quote:', error);
      throw error;
    }
  }

  // Set exchange rate (admin function)
  async setExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    source: string = 'manual'
  ): Promise<void> {
    try {
      // Deactivate old rates
      await db
        .update(exchangeRates)
        .set({ isActive: false })
        .where(
          and(
            eq(exchangeRates.fromCurrency, fromCurrency),
            eq(exchangeRates.toCurrency, toCurrency)
          )
        );

      // Insert new rate
      await db.insert(exchangeRates).values({
        fromCurrency,
        toCurrency,
        rate: rate.toString(),
        source,
        isActive: true,
      });
    } catch (error) {
      console.error('Error setting exchange rate:', error);
      throw error;
    }
  }

  // Initialize default exchange rates
  async initializeDefaultRates(): Promise<void> {
    try {
      // Set default 1:1 rate for PHP to PUSO
      await this.setExchangeRate('PHP', 'PUSO', 1.0, 'system');
      await this.setExchangeRate('PUSO', 'PHP', 1.0, 'system');
      
      console.log('Default exchange rates initialized');
    } catch (error) {
      console.error('Error initializing default rates:', error);
      throw error;
    }
  }

  // Convert currency amounts (for display/calculation purposes)
  convertAmount(
    amount: number,
    exchangeRate: number
  ): number {
    return amount * exchangeRate;
  }

  // Get conversion fees structure
  getConversionFees(): ConversionFees {
    return { ...this.defaultFees };
  }

  // Update conversion fees (admin function)
  updateConversionFees(newFees: Partial<ConversionFees>): void {
    this.defaultFees = {
      ...this.defaultFees,
      ...newFees,
    };
  }

  // Format currency amount for display
  formatCurrency(amount: number, currency: string): string {
    if (currency === 'PHP') {
      return `₱${amount.toLocaleString('en-PH', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}`;
    }
    if (currency === 'PUSO') {
      return `${amount.toLocaleString('en-PH', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 6 
      })} PUSO`;
    }
    return `${amount} ${currency}`;
  }

  // Validate conversion parameters
  validateConversionParams(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): { valid: boolean; error?: string } {
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (amount < 1) {
      return { valid: false, error: 'Minimum conversion amount is ₱1' };
    }

    if (amount > 1000000) {
      return { valid: false, error: 'Maximum conversion amount is ₱1,000,000' };
    }

    const supportedCurrencies = ['PHP', 'PUSO'];
    if (!supportedCurrencies.includes(fromCurrency) || !supportedCurrencies.includes(toCurrency)) {
      return { valid: false, error: 'Unsupported currency' };
    }

    if (fromCurrency === toCurrency) {
      return { valid: false, error: 'Cannot convert to same currency' };
    }

    return { valid: true };
  }
}

export const conversionService = new ConversionService();