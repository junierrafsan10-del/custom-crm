import { useState } from 'react';
import { Clock } from 'lucide-react';

export default function UnpickModal({ isOpen, onConfirm, onCancel }) {
  const [unpickReason, setUnpickReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[400px] bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 animate-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> Confirm Unpick Ticket
          </h3>
          <p className="text-xs text-slate-400 mt-1">Are you sure you want to return this ticket to the inbound queue? Please provide a reason.</p>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Unpick Reason</label>
          <textarea
            value={unpickReason}
            onChange={e => setUnpickReason(e.target.value)}
            placeholder="e.g. Needs technical support, customer offline, wrong department..."
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 resize-none h-24 placeholder-slate-600"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2.5">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all">Cancel</button>
          <button onClick={() => onConfirm(unpickReason)} disabled={!unpickReason.trim()} className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600/20 disabled:hover:text-amber-400 disabled:hover:border-amber-500/20 rounded-xl text-xs font-bold transition-all">Confirm Unpick</button>
        </div>
      </div>
    </div>
  );
}
