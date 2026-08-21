import { prisma } from '@/lib/prisma';
import { BANK_CONFIG, BANK_ORDER, type BankCode } from '@/lib/verify-et';

export interface BankAccountRecord {
  id: string;
  bank: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  phone_number: string | null;
  instructions: string | null;
  is_active: boolean;
}

const DEFAULT_BANK_ACCOUNTS: Array<{
  bank: BankCode;
  bank_name: string;
  account_name: string;
  account_number: string;
  phone_number?: string;
  instructions?: string;
  is_active: boolean;
}> = [
  {
    bank: 'cbe',
    bank_name: 'Commercial Bank of Ethiopia (CBE)',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: process.env.CBE_ACCOUNT_NUMBER || '1000123456789',
    phone_number: '',
    instructions: 'Transfer via CBE Birr, CBE Mobile Banking, or bank branch. Use the FT reference number for instant verification.',
    is_active: true,
  },
  {
    bank: 'boa',
    bank_name: 'Bank of Abyssinia (BOA)',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: '12345678',
    phone_number: '',
    instructions: 'Transfer via BOA Mobile Banking or branch deposit. Enter the transaction reference number.',
    is_active: true,
  },
  {
    bank: 'telebirr',
    bank_name: 'Telebirr',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: '0911000000',
    phone_number: '0911000000',
    instructions: 'Send money via Telebirr SuperApp to this phone number / merchant code.',
    is_active: false, // Telebirr verification currently down upstream
  },
  {
    bank: 'mpesa',
    bank_name: 'M-Pesa',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: '0711000000',
    phone_number: '0711000000',
    instructions: 'Pay to this M-Pesa number / till. Use the transaction code received via SMS.',
    is_active: true,
  },
  {
    bank: 'cbebirr',
    bank_name: 'CBE Birr',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: '0911000000',
    phone_number: '0911000000',
    instructions: 'Pay via CBE Birr to this phone number. Provide your sender phone number and receipt number.',
    is_active: true,
  },
  {
    bank: 'dashen',
    bank_name: 'Dashen Bank',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: '5001234567',
    phone_number: '',
    instructions: 'Transfer via Amole / Dashen Mobile Banking or branch deposit.',
    is_active: true,
  },
  {
    bank: 'awash',
    bank_name: 'Awash Bank',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: '01320000000000',
    phone_number: '',
    instructions: 'Transfer via Awash Birr / Awash Mobile Banking or branch deposit.',
    is_active: true,
  },
  {
    bank: 'siinqee',
    bank_name: 'Siinqee Bank',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: '1000000000',
    phone_number: '',
    instructions: 'Transfer via Siinqee Mobile Banking or branch deposit.',
    is_active: true,
  },
  {
    bank: 'kaafiebirr',
    bank_name: 'Kaafi Ebirr',
    account_name: process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy',
    account_number: '0611000000',
    phone_number: '',
    instructions: 'Transfer via Kaafi Ebirr mobile app.',
    is_active: true,
  },
];

/**
 * Ensures default bank accounts exist in the database.
 */
export async function ensureDefaultBankAccounts() {
  for (const def of DEFAULT_BANK_ACCOUNTS) {
    const existing = await prisma.bankAccount.findUnique({
      where: { bank: def.bank },
    });

    if (!existing) {
      await prisma.bankAccount.create({
        data: {
          bank: def.bank,
          bank_name: def.bank_name,
          account_name: def.account_name,
          account_number: def.account_number,
          phone_number: def.phone_number || null,
          instructions: def.instructions || null,
          is_active: def.is_active,
        },
      });
    }
  }
}

/**
 * Fetches all bank accounts for admin management (ordered by BANK_ORDER).
 */
export async function getAllBankAccounts(): Promise<BankAccountRecord[]> {
  await ensureDefaultBankAccounts();

  const accounts = await prisma.bankAccount.findMany();

  // Sort by defined bank order
  return accounts
    .map((acc) => ({
      id: acc.id,
      bank: acc.bank,
      bank_name: acc.bank_name || BANK_CONFIG[acc.bank as BankCode]?.name || acc.bank.toUpperCase(),
      account_name: acc.account_name,
      account_number: acc.account_number,
      phone_number: acc.phone_number,
      instructions: acc.instructions,
      is_active: acc.is_active,
    }))
    .sort((a, b) => {
      const idxA = BANK_ORDER.indexOf(a.bank as BankCode);
      const idxB = BANK_ORDER.indexOf(b.bank as BankCode);
      return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
    });
}

/**
 * Fetches only active bank accounts for student course view.
 */
export async function getActiveBankAccounts(): Promise<BankAccountRecord[]> {
  const all = await getAllBankAccounts();
  return all.filter((a) => a.is_active);
}
