
import Dexie, {
  type EntityTable,
  type Table,
} from 'dexie';

import type {
  AppSetting,
  ExchangeRate,
  Product,
  SaleRecord,
} from '../types/models';

class PriceManagerDatabase extends Dexie {
  products!: Table<Product, number>;

  exchangeRates!: EntityTable<
    ExchangeRate,
    'currencyCode'
  >;

  settings!: EntityTable<AppSetting, 'key'>;

  sales!: Table<SaleRecord, number>;

  constructor() {
    super('PriceManagerDB');

    this.version(1).stores({
      products: '++id, &code, name, currencyCode',
      exchangeRates: '&currencyCode, updatedAt',
      settings: '&key, updatedAt',
    });

    this.version(2)
      .stores({
        products: '++id, &code, name, currencyCode, updatedAt',
        exchangeRates: '&currencyCode, updatedAt',
        settings: '&key, updatedAt',
        sales: '++id, productId, soldAt, productName, productCode',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('products')
          .toCollection()
          .modify((product) => {
            const item = product as Product;

            if (
              !Number.isSafeInteger(item.stockQuantity) ||
              item.stockQuantity < 0
            ) {
              item.stockQuantity = 0;
            }

            if (
              !Number.isSafeInteger(item.priceMultiplierBps) ||
              item.priceMultiplierBps <= 0
            ) {
              item.priceMultiplierBps = 10000;
            }
          });
      });

    // Version 3: explicitly ensure the updatedAt index exists.
    this.version(3).stores({
      products: '++id, &code, name, currencyCode, updatedAt',
      exchangeRates: '&currencyCode, updatedAt',
      settings: '&key, updatedAt',
      sales: '++id, productId, soldAt, productName, productCode',
    });
  }
}

export const db = new PriceManagerDatabase();
