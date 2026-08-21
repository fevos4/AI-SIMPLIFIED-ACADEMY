'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Landmark, Save, Check, ArrowLeft, AlertCircle, ToggleLeft, ToggleRight, Phone, CreditCard, Info } from 'lucide-react';
import { BankAccountRecord } from '@/lib/bank-accounts';

interface AdminBankAccountsClientProps {
  initialBankAccounts: BankAccountRecord[];
}

export default function AdminBankAccountsClient({ initialBankAccounts }: AdminBankAccountsClientProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>(initialBankAccounts);
  const [savingBankId, setSavingBankId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form field state for inline editing
  const [editedFields, setEditedFields] = useState<Record<string, Partial<BankAccountRecord>>>({});

  const handleFieldChange = (id: string, field: keyof BankAccountRecord, value: any) => {
    setEditedFields((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const getFieldValue = (account: BankAccountRecord, field: keyof BankAccountRecord) => {
    if (editedFields[account.id] && editedFields[account.id][field] !== undefined) {
      return editedFields[account.id][field];
    }
    return account[field];
  };

  const handleToggleActive = async (account: BankAccountRecord) => {
    const currentActive = getFieldValue(account, 'is_active') as boolean;
    const nextActive = !currentActive;
    handleFieldChange(account.id, 'is_active', nextActive);

    // Save immediately
    setSavingBankId(account.id);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/bank-accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setBankAccounts((prev) =>
        prev.map((acc) => (acc.id === account.id ? { ...acc, is_active: nextActive } : acc))
      );

      setSaveSuccessId(account.id);
      setTimeout(() => setSaveSuccessId(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating status');
    } finally {
      setSavingBankId(null);
    }
  };

  const handleSaveAccount = async (account: BankAccountRecord) => {
    setSavingBankId(account.id);
    setErrorMessage(null);

    const changes = editedFields[account.id] || {};
    const account_name = (changes.account_name !== undefined ? changes.account_name : account.account_name) as string;
    const account_number = (changes.account_number !== undefined ? changes.account_number : account.account_number) as string;
    const phone_number = (changes.phone_number !== undefined ? changes.phone_number : account.phone_number) as string;
    const instructions = (changes.instructions !== undefined ? changes.instructions : account.instructions) as string;
    const is_active = (changes.is_active !== undefined ? changes.is_active : account.is_active) as boolean;

    try {
      const res = await fetch(`/api/admin/bank-accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name,
          account_number,
          phone_number,
          instructions,
          is_active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save bank account');
      }

      const { bankAccount: updated } = await res.json();

      setBankAccounts((prev) =>
        prev.map((acc) => (acc.id === account.id ? { ...acc, ...updated } : acc))
      );

      // Clear staged edits for this account
      setEditedFields((prev) => {
        const next = { ...prev };
        delete next[account.id];
        return next;
      });

      setSaveSuccessId(account.id);
      setTimeout(() => setSaveSuccessId(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving changes');
    } finally {
      setSavingBankId(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '0px',
    border: '1.5px solid #191510',
    backgroundColor: '#FFFFFF',
    color: '#191510',
    fontSize: '0.88rem',
    outline: 'none',
    fontFamily: "'IBM Plex Sans', sans-serif",
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#191510',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: "'IBM Plex Sans', sans-serif",
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '3.5rem 1.5rem', boxSizing: 'border-box' }}>
        <Link
          href="/admin"
          style={{
            color: '#191510',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1rem',
            textDecoration: 'none',
            fontWeight: '500',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft width={16} height={16} /> Back to Admin Dashboard
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Bank Accounts &amp; Payment Methods
            </h1>
            <p style={{ margin: 0, color: '#55503F', fontSize: '0.95rem' }}>
              Configure your receiving bank accounts, mobile wallets, and account numbers. Toggle which banks appear on students&apos; course purchase drawer.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#F7F3EA',
              border: '1.5px solid #A63A2C',
              color: '#A63A2C',
              borderRadius: '0px',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle width={18} height={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bank Accounts Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bankAccounts.map((account) => {
            const isActive = getFieldValue(account, 'is_active') as boolean;
            const accountName = getFieldValue(account, 'account_name') as string;
            const accountNumber = getFieldValue(account, 'account_number') as string;
            const phoneNumber = (getFieldValue(account, 'phone_number') as string) || '';
            const instructions = (getFieldValue(account, 'instructions') as string) || '';

            const isSaving = savingBankId === account.id;
            const isSaved = saveSuccessId === account.id;
            const hasUnsavedChanges = editedFields[account.id] !== undefined;

            return (
              <div
                key={account.id}
                style={{
                  border: isActive ? '1.5px solid #191510' : '1px solid rgba(25, 21, 16, 0.2)',
                  backgroundColor: isActive ? '#FFFFFF' : '#FAF8F5',
                  padding: '1.75rem',
                  borderRadius: '0px',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Bank Card Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(25, 21, 16, 0.1)',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#F7F3EA',
                        border: '1px solid rgba(25, 21, 16, 0.14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Landmark width={20} height={20} color="#191510" />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.15rem',
                          fontWeight: '700',
                          fontFamily: "'Space Grotesk', sans-serif",
                          color: '#191510',
                        }}
                      >
                        {account.bank_name}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#9A9284', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Bank Code: <strong style={{ color: '#191510' }}>{account.bank}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Active Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(account)}
                      disabled={isSaving}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.85rem',
                        border: isActive ? '1.5px solid #3F6B4A' : '1.5px solid rgba(25, 21, 16, 0.3)',
                        backgroundColor: isActive ? '#E8F5E9' : '#F7F3EA',
                        color: isActive ? '#2E7D32' : '#9A9284',
                        borderRadius: '0px',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isActive ? (
                        <>
                          <ToggleRight width={18} height={18} color="#2E7D32" />
                          <span>Visible to Students</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft width={18} height={18} color="#9A9284" />
                          <span>Hidden from Students</span>
                        </>
                      )}
                    </button>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveAccount(account)}
                      disabled={isSaving}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 1rem',
                        backgroundColor: isSaved ? '#3F6B4A' : hasUnsavedChanges ? '#A63A2C' : '#191510',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '0px',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {isSaving ? (
                        <span>Saving...</span>
                      ) : isSaved ? (
                        <>
                          <Check width={14} height={14} strokeWidth={2.5} />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save width={14} height={14} />
                          <span>{hasUnsavedChanges ? 'Save Changes *' : 'Save'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  {/* Account Name */}
                  <div>
                    <label style={labelStyle}>
                      Account Name / Beneficiary Name *
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => handleFieldChange(account.id, 'account_name', e.target.value)}
                      placeholder="e.g. AI Simplified Academy"
                      style={inputStyle}
                    />
                  </div>

                  {/* Account Number / Till / Paybill */}
                  <div>
                    <label style={labelStyle}>
                      Account Number / Till / Phone No. *
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => handleFieldChange(account.id, 'account_number', e.target.value)}
                      placeholder={account.bank === 'cbe' ? 'e.g. 1000123456789' : 'e.g. Account or Phone number'}
                      style={inputStyle}
                    />
                  </div>

                  {/* Optional Phone Number */}
                  <div>
                    <label style={labelStyle}>
                      Contact / Notification Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handleFieldChange(account.id, 'phone_number', e.target.value)}
                      placeholder="e.g. 0911234567"
                      style={inputStyle}
                    />
                  </div>

                  {/* Instructions */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>
                      Instructions for Student (Shown in Payment Drawer)
                    </label>
                    <textarea
                      rows={2}
                      value={instructions}
                      onChange={(e) => handleFieldChange(account.id, 'instructions', e.target.value)}
                      placeholder="e.g. Transfer using mobile banking or branch deposit. Enter the transaction reference code after completing the payment."
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
