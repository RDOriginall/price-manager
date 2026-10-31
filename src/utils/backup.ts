import { db } from '../db/database';

export async function createBackup() {
  const [products, exchangeRates, settings, sales] = await Promise.all([
    db.products.toArray(),
    db.exchangeRates.toArray(),
    db.settings.toArray(),
    db.sales.toArray(),
  ]);

  return {
    app: 'price-manager',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    products,
    exchangeRates,
    settings,
    sales,
  };
}

export async function exportBackup(): Promise<void> {
  const payload = await createBackup();
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importBackup(file: File): Promise<void> {
  const data = JSON.parse(await file.text());

  if (
    data?.app !== 'price-manager' ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.exchangeRates) ||
    !Array.isArray(data.settings) ||
    !Array.isArray(data.sales)
  ) {
    throw new Error('فایل بک‌آپ معتبر نیست.');
  }

  await db.transaction('rw', db.products, db.exchangeRates, db.settings, db.sales, async () => {
    await Promise.all([
      db.products.clear(),
      db.exchangeRates.clear(),
      db.settings.clear(),
      db.sales.clear(),
    ]);
    await db.products.bulkAdd(data.products);
    await db.exchangeRates.bulkAdd(data.exchangeRates);
    await db.settings.bulkAdd(data.settings);
    await db.sales.bulkAdd(data.sales);
  });
}