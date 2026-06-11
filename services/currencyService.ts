import { Currency } from "../types";

const BASE_URL = "https://open.er-api.com/v6/latest";

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

class CurrencyService {
  private cache: Record<string, { rates: ExchangeRates; timestamp: number }> = {};
  private CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  async getRates(base: Currency = Currency.USD): Promise<ExchangeRates | null> {
    const now = Date.now();
    if (this.cache[base] && now - this.cache[base].timestamp < this.CACHE_DURATION) {
      return this.cache[base].rates;
    }

    try {
      const response = await fetch(`${BASE_URL}/${base}`);
      if (!response.ok) throw new Error("Failed to fetch rates");
      const data = await response.json();
      this.cache[base] = { rates: data, timestamp: now };
      return data;
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      return null;
    }
  }

  convert(amount: number, from: Currency, to: Currency, rates: Record<string, number>): number {
    if (from === to) return amount;

    // The rates are relative to the base currency that was used to fetch them.
    // If we have rates for USD, then rates['INR'] is how many INR per 1 USD.
    // amountInBase = amount / rates[from]
    // amountInTarget = amountInBase * rates[to]

    // Assuming the rates object passed in is based on 'from'
    if (rates[to]) {
        return amount * rates[to];
    }

    return amount; // Fallback
  }
}

export const currencyService = new CurrencyService();
