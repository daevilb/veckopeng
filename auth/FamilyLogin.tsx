import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export const FamilyLogin: React.FC = () => {
  const { login } = useAuth();
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const ok = await login(key.trim());
    setLoading(false);

    if (!ok) {
      setError('Fel familjekod. Kontrollera och försök igen.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-slate-800/80 p-8 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold mb-4 text-center">
          🔐 Veckopeng – familjekod
        </h1>
        <p className="text-sm text-slate-300 mb-6 text-center">
          Ange din familjekod för att låsa upp appen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Familjekod
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="t.ex. hemlig-superkod"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full rounded-xl px-3 py-2 font-semibold bg-emerald-500 disabled:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-emerald-400 transition"
          >
            {loading ? 'Kontrollerar…' : 'Lås upp Veckopeng'}
          </button>
        </form>
      </div>
    </div>
  );
};
