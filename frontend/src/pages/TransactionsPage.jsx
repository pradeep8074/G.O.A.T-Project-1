import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  ShieldCheck, 
  RefreshCw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatINR } from '../utils/currency';

export default function TransactionsPage({
  transactions,
  loading,
  error,
  onRetry,
  onSelectTransaction
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // Bank filter
      if (selectedBank !== 'ALL' && txn.bank !== selectedBank) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && txn.status !== selectedStatus) {
        return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesId = txn.id.toLowerCase().includes(term);
        const matchesSender = txn.sender.toLowerCase().includes(term);
        const matchesReceiver = txn.receiver.toLowerCase().includes(term);
        const matchesBank = txn.bank.toLowerCase().includes(term);
        const matchesType = (txn.type || '').toLowerCase().includes(term);
        return matchesId || matchesSender || matchesReceiver || matchesBank || matchesType;
      }
      return true;
    });
  }, [transactions, selectedBank, selectedStatus, searchTerm]);

  const hasActiveFilters = searchTerm !== '' || selectedBank !== 'ALL' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBank('ALL');
    setSelectedStatus('ALL');
  };

  if (loading) {
    return <LoadingState message="Loading synthetic transactions dataset..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Cross-Bank Transactions</h2>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50">
              Synthetic Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated inter-bank settlements across Bank A, Bank B, and Bank C. Click any row to view ledger breakdown.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-semibold">{filteredTransactions.length}</span> of {transactions.length} records
        </div>
      </div>

      {error && (
        <ErrorState message={error} onRetry={onRetry} isFallback={transactions.length > 0} />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, sender, receiver, or type..."
              className="w-full bg-[#080d16] border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Bank Filter */}
          <div className="relative">
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full bg-[#080d16] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium appearance-none cursor-pointer"
            >
              <option value="ALL">All Banks (A, B, C)</option>
              <option value="Bank A">Bank A (Apex National)</option>
              <option value="Bank B">Bank B (Beacon Mutual)</option>
              <option value="Bank C">Bank C (Crestline)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#080d16] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="Review">Review</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>
        </div>

        {/* Filter tags & reset */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-500">Active filters:</span>
            {selectedBank !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                Bank: {selectedBank}
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                Status: {selectedStatus}
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                Query: "{searchTerm}"
              </span>
            )}
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors font-mono"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0f1c] text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Bank</th>
                <th className="py-3.5 px-4">Sender</th>
                <th className="py-3.5 px-4">Receiver</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTransaction(txn)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400 group-hover:text-blue-300">
                      {txn.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {txn.bank}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 max-w-[130px] truncate" title={txn.sender}>
                      {txn.sender}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 max-w-[130px] truncate" title={txn.receiver}>
                      {txn.receiver}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {txn.type || 'Wire'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {formatINR(txn.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {txn.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={txn.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium text-slate-400">No transactions match your criteria</p>
                    <p className="text-xs mt-1">Try adjusting the filter options above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
