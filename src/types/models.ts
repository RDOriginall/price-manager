import type { CurrencyCode } from '../data/currenties';

export type RateSource = 'manual' | 'api';

export interface Product {
    id?: number;
    code?: string;
    name: string;
    currencyCode: CurrencyCode;

    // Example: USD 12.50 is sorted as 1250
    foreignPriceMinor: number;

    stockQuantity: number;
    priceMultiplierBps: number;

    createdAt: string;
    updatedAt: string;
}

export interface ExchangeRate {
    currencyCode: CurrencyCode;

    // Toman per full unit of foreign currency.
    rateToToman: number;

    source: RateSource;
    updatedAt: string;
}

export interface AppSetting {
    key: string;
    value: string | number | boolean;
    updatedAt: string;
}


export interface SaleRecord {
    id?: number;

    // Product information captured at sale time.
    productId: number;
    productName: string;
    productCode?: string;

    quantity: number;
    currencyCode: CurrencyCode;
    productPriceMinorAtSale: number;
    priceMultiplierBpsAtSale: number;

    // Null when no exchange rate is needed or available.
    exchangeRateToToman: number | null;

    unitPriceToman: number;
    totalPriceToman: number;
    soldAt: string;
}