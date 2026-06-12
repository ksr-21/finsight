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

    // The rates are relative to USD.
    // If we have rates for USD, then rates['INR'] is how many INR per 1 USD.
    // amountInBase = amount / rates[from]
    // amountInTarget = amountInBase * rates[to]
    const fromRate = from === Currency.USD ? 1 : rates[from];
    const toRate = to === Currency.USD ? 1 : rates[to];

    if (fromRate && toRate && fromRate > 0) {
      return (amount / fromRate) * toRate;
    }

    return amount; // Fallback
  }

  convertToBase(amount: number, from: Currency, rates: Record<string, number>): number {
    if (from === Currency.USD) return amount;

    // If rates are based on USD, then rates[from] is units of 'from' per 1 USD.
    // So 1 unit of 'from' = 1 / rates[from] USD.
    const rate = rates[from];
    if (rate && rate > 0) {
      return amount / rate;
    }

    return amount;
  }
}

export const currencyService = new CurrencyService();
