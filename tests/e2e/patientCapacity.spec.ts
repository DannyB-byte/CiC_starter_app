import { test, expect } from '@playwright/test';

test('patient database rolls back a conflicting transaction', async ({ page }) => {
  await page.goto('/#diary');
  await expect(page.getByRole('button', { name: 'Save reading' })).toBeEnabled();
  const result = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('cic-patient-v1', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const aborted = await new Promise<boolean>(resolve => {
        const tx = db.transaction(['readings', 'entries'], 'readwrite');
        tx.onabort = () => resolve(true);
        tx.oncomplete = () => resolve(false);
        tx.objectStore('readings').add({ id: 'rollback-reading' });
        tx.objectStore('entries').add({ id: 'duplicate' });
        tx.objectStore('entries').add({ id: 'duplicate' });
      });
      const counts = await new Promise<number[]>((resolve, reject) => {
        const tx = db.transaction(['readings', 'entries'], 'readonly');
        const a = tx.objectStore('readings').count();
        const b = tx.objectStore('entries').count();
        tx.oncomplete = () => resolve([a.result, b.result]);
        tx.onabort = () => reject(tx.error);
      });
      return { aborted, counts };
    } finally { db.close(); }
  });
  expect(result).toEqual({ aborted: true, counts: [0, 0] });
});

test('50,000 synthetic readings support bounded indexed retrieval', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chrome', 'Capacity benchmark runs on desktop Chrome.');
  test.setTimeout(120000);
  await page.goto('/#diary');
  await expect(page.getByRole('button', { name: 'Save reading' })).toBeEnabled();
  const result = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('cic-patient-v1', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const start = performance.now();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('readings', 'readwrite');
        const store = tx.objectStore('readings');
        for (let i = 0; i < 50000; i++) store.add({ id: `synthetic-${i}`, date: '2026-01-01', recordedAt: '2026-01-01T12:00:00Z', temperature: 37, note: '' });
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
      const writeMs = performance.now() - start;
      const queryStart = performance.now();
      const result = await new Promise<{ count: number; pageSize: number }>((resolve, reject) => {
        const tx = db.transaction('readings', 'readonly');
        const store = tx.objectStore('readings');
        const count = store.count();
        const rows = store.index('date').getAll(IDBKeyRange.only('2026-01-01'), 100);
        tx.oncomplete = () => resolve({ count: count.result, pageSize: rows.result.length });
        tx.onabort = () => reject(tx.error);
      });
      return { ...result, writeMs, queryMs: performance.now() - queryStart };
    } finally { db.close(); }
  });
  console.log('Synthetic capacity benchmark:', result);
  expect(result.count).toBe(50000);
  expect(result.pageSize).toBe(100);
});
