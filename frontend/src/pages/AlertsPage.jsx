import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Clock, 
  Terminal,
  Layers,
  ArrowRight
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function AlertsPage({ alerts, loading, error, onRetry }) {
  if (loading) {
    return <LoadingState message="Loading synthetic risk signals..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Security & Fraud Alerts</h2>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50">
              Mock Indicators
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated cross-bank velocity flags and mule account patterns.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Alerts: <span className="text-white font-semibold">{alerts.length}</span>
        </div>
      </div>

      {/* Required Stage 1 Prominent Notice */}
      <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Notice: Stage 1 Prototype Evaluation
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            These are currently <strong>MOCK alert reasons</strong> generated to demonstrate the incident response interface. 
            <span className="text-white font-semibold"> Detection engine will be connected in a later stage.</span>
          </p>
        </div>
      </div>

      {error && (
        <ErrorState message={error} onRetry={onRetry} isFallback={alerts.length > 0} />
      )}

      {/* Alerts Table */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0f1c] text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Alert ID</th>
                <th className="py-3.5 px-4">Account</th>
                <th className="py-3.5 px-4">Bank</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Flagged Reason (Mock)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-rose-400">
                    {alert.id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-200">
                    {alert.account}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {alert.bank}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={alert.risk} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">
                    <div>
                      <p className="font-medium text-slate-200">{alert.reason}</p>
                      {alert.details && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{alert.details}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={alert.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {alert.created}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
