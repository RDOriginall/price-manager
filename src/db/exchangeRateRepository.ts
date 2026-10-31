import { db } from './database';
import type { ExchangeRate } from '../types/models';
import type { CurrencyCode } from '../data/currenties';

/**
 * Returns all exchange rates saved in the local database.
 */

export async function getAllExchangeRates(): Promise<ExchangeRate[]> {
    return db.exchangeRates.toArray()
}

/**
 * Returns the saved rate for a currency, if available.
 */
export async function getExchangeRate(
    currencyCode: CurrencyCode,
): Promise<ExchangeRate | undefined> {
    return db.exchangeRates.get(currencyCode);
}



/**
 * Saves or replaces a manualy entered exchanged rate.
 * The rate is expressed in Toman per one full unit of foreign currency.
 */
export async function saveManualExchangeRate(
    currencyCode: CurrencyCode,
    rateToToman: number,
): Promise<void> {
    if (!Number.isSafeInteger(rateToToman) || rateToToman <= 0) {
        throw new Error(
            'Exchange rate must be a positive whole number in Toman.',
        );
    }



const exchangeRate: ExchangeRate = {
    currencyCode,
    rateToToman,
    source: 'manual',
    updatedAt: new Date().toISOString(),
};


await db.exchangeRates.put(exchangeRate)

}