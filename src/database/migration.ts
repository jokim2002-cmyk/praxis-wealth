import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, createTables } from './schema';

const STORE_KEY = 'praxis_local_store_v2';
const MIGRATED_KEY = 'praxis_migrated_v1';

export async function runMigration() {
  try {
    const migrated = await AsyncStorage.getItem(MIGRATED_KEY);
    if (migrated === '1') {
      console.log('[Migration] Already migrated, skipping.');
      return true;
    }

    console.log('[Migration] Starting migration...');

    // Create tables first
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.error('[Migration] Failed to create tables.');
      return false;
    }

    // Read existing data
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) {
      console.log('[Migration] No data to migrate.');
      await AsyncStorage.setItem(MIGRATED_KEY, '1');
      return true;
    }

    const store = JSON.parse(raw);

    // Migrate profile
    if (store.profile) {
      const p = store.profile;
      await db.runAsync(
        `INSERT OR REPLACE INTO profile (id, name, monthly_income, income_type, cash_on_hand, bank_balance, emergency_fund, onboarded, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id || 'default',
        p.name || 'You',
        p.monthly_income || 0,
        p.income_type || 'fixed',
        p.cash_on_hand || 0,
        p.bank_balance || 0,
        p.emergency_fund || 0,
        p.onboarded ? 1 : 0,
        Date.now(),
        Date.now()
      );
      console.log('[Migration] Profile migrated.');
    }

    // Migrate transactions
    if (store.transactions && store.transactions.length > 0) {
      for (const tx of store.transactions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transactions (id, amount, description, category, type, date, notes, ai_categorized, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          tx.id || 'tx-' + Date.now() + Math.random().toString(36).slice(2, 8),
          tx.amount || 0,
          tx.description || '',
          tx.category || 'other',
          tx.type || 'expense',
          new Date(tx.date || Date.now()).getTime(),
          tx.notes || '',
          tx.ai_categorized ? 1 : 0,
          Date.now(),
          Date.now()
        );
      }
      console.log(`[Migration] ${store.transactions.length} transactions migrated.`);
    }

    await AsyncStorage.setItem(MIGRATED_KEY, '1');
    console.log('[Migration] ✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('[Migration] ❌ Failed:', error);
    return false;
  }
}
