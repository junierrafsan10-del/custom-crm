import { useState, useEffect } from 'react';
import { post, put } from '../../utils/api';
import { Plus } from 'lucide-react';

const PRODUCTS = [
  'Premium Polo Shirt', 'Casual Denim Shirt', 'Slim Fit Chino Pants',
  'Classic Cotton Panjabi', 'Designer Leather Wallet', 'Leather Loafers',
  'Smart Casual Blazer'
];

export default function ConvertLeadModal({ isOpen, onClose, currentChat, matchingLead, onRefresh, onToast }) {
  const [leadMode, setLeadMode] = useState('create');
  const [matchingLeadId, setMatchingLeadId] = useState(null);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadTitle, setLeadTitle] = useState('');
  const [leadProduct, setLeadProduct] = useState(PRODUCTS[0]);
  const [leadStage, setLeadStage] = useState('Intake');
  const [leadValue, setLeadValue] = useState('');
  const [leadSource, setLeadSource] = useState('Facebook');
  const [leadFollowups, setLeadFollowups] = useState([]);
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [newFollowUpTitle, setNewFollowUpTitle] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [newFollowUpAgent, setNewFollowUpAgent] = useState('Majharul_Islam_Sifat');

  useEffect(() => {
    if (!isOpen) return;
    if (matchingLead) {
      setLeadMode('update');
      setMatchingLeadId(matchingLead._id || matchingLead.id);
      setLeadName(matchingLead.name || '');
      setLeadPhone(matchingLead.phone || '');
      setLeadEmail(matchingLead.email || '');
      setLeadTitle(matchingLead.title || '');
      setLeadProduct(matchingLead.product || PRODUCTS[0]);
      setLeadStage(matchingLead.stage || 'Intake');
      let rawVal = matchingLead.value || '';
      if (rawVal.startsWith('$')) rawVal = rawVal.substring(1);
      setLeadValue(rawVal);
      setLeadSource(matchingLead.source || (currentChat.platform === 'whatsapp' ? 'WhatsApp' : 'Facebook'));
      setLeadFollowups(matchingLead.followups || []);
    } else {
      setLeadMode('create');
      setMatchingLeadId(null);
      setLeadName(currentChat.name || '');
      setLeadPhone(currentChat.phone === 'N/A' ? '' : (currentChat.phone || ''));
      setLeadEmail(currentChat.email === 'N/A' ? '' : (currentChat.email || ''));
      setLeadTitle('');
      setLeadProduct(PRODUCTS[0]);
      setLeadStage('Intake');
      setLeadValue('');
      setLeadSource(currentChat.platform === 'whatsapp' ? 'WhatsApp' : 'Facebook');
      setLeadFollowups([]);
    }
    setHasFollowUp(false);
    setNewFollowUpTitle('');
    setNewFollowUpDate('');
    setNewFollowUpAgent('Majharul_Islam_Sifat');
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!leadName.trim()) { alert('Name is required'); return; }

    const payload = {
      name: leadName.trim(), email: leadEmail.trim(), phone: leadPhone.trim(),
      title: leadTitle.trim(), product: leadProduct, stage: leadStage,
      source: leadSource, value: leadValue ? `$${leadValue}` : '$0',
      followups: leadFollowups
    };

    const isUpdate = leadMode === 'update';
    const request = isUpdate ? put(`/api/leads/${matchingLeadId}`, payload) : post('/api/leads', payload);
    request.then(data => {
      if (data.success) {
        onClose();
        onToast(`Successfully ${isUpdate ? 'updated' : 'converted'} ${leadName} ${isUpdate ? 'details' : 'to a Lead'}!`);
        onRefresh();
      } else {
        alert(`Failed to ${isUpdate ? 'update' : 'convert'} lead: ` + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error(`Error ${isUpdate ? 'updating' : 'converting'} lead:`, err);
      alert('Could not reach backend to save lead.');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[480px] bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Plus size={16} className="text-indigo-400" /> {leadMode === 'update' ? 'Update Lead' : 'Convert to Lead'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{leadMode === 'update' ? "Update this lead's sales funnel and follow up information." : 'Add this contact to your active sales funnel leads list.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Profile / Name</label>
            <input type="text" value={leadName} onChange={e => setLeadName(e.target.value)} className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Phone</label>
              <input type="text" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="e.g. +88017..." className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Email</label>
              <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="e.g. name@example.com" className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Lead Title / Inquiry</label>
            <input type="text" value={leadTitle} onChange={e => setLeadTitle(e.target.value)} placeholder="e.g. Shirt order, custom design inquiry..." className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Product</label>
              <select value={leadProduct} onChange={e => setLeadProduct(e.target.value)} className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60">
                {PRODUCTS.map(prod => <option key={prod} value={prod}>{prod}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Stage</label>
              <select value={leadStage} onChange={e => setLeadStage(e.target.value)} className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60">
                <option value="Intake">Intake (ইনটেক)</option>
                <option value="Interested">Interested (ইন্টারেস্টেড)</option>
                <option value="Qualified">Qualify (কোয়ালিফাই)</option>
                <option value="Converted">Convert (কনভার্ট)</option>
                <option value="Lost">Lost (লস্ট)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Source</label>
              <select value={leadSource} onChange={e => setLeadSource(e.target.value)} className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60">
                <option value="Facebook">Facebook</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Calling">Calling</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Estimated Value ($)</label>
              <input type="number" value={leadValue} onChange={e => setLeadValue(e.target.value)} placeholder="e.g. 1500" className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60" />
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Scheduled Follow Ups</span>
              <button type="button" onClick={() => setHasFollowUp(!hasFollowUp)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                <Plus size={12} /> Add Follow Up
              </button>
            </div>

            {leadFollowups.length > 0 && (
              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
                {leadFollowups.map((f, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/60 p-2.5 rounded-xl text-[11px] text-slate-300 font-medium">
                    <div>
                      <p className="font-semibold text-slate-200">{f.title}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Agent: {f.agent} &bull; Due: {new Date(f.dueDateTime).toLocaleString()}{f.notified && <span className="ml-1.5 text-emerald-500 font-bold">(Notified)</span>}</p>
                    </div>
                    <button type="button" onClick={() => setLeadFollowups(prev => prev.filter((_, i) => i !== index))} className="text-[10px] text-rose-500 hover:text-rose-400 font-semibold px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-all">Remove</button>
                  </div>
                ))}
              </div>
            )}

            {hasFollowUp && (
              <div className="bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-xl space-y-3 mt-2">
                <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">New Follow Up</h4>
                <div>
                  <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Follow Up Title</label>
                  <input type="text" value={newFollowUpTitle} onChange={e => setNewFollowUpTitle(e.target.value)} placeholder="e.g. Call client for negotiation" className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Assign Agent</label>
                    <select value={newFollowUpAgent} onChange={e => setNewFollowUpAgent(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
                      <option value="Majharul_Islam_Sifat">Majharul_Islam_Sifat</option>
                      <option value="Support Member A">Support Member A</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">Due Date & Time</label>
                    <input type="datetime-local" value={newFollowUpDate} onChange={e => setNewFollowUpDate(e.target.value)} onClick={(e) => { try { e.target.showPicker(); } catch (err) { console.warn("showPicker is not supported in this browser:", err); } }} className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" onClick={() => { setHasFollowUp(false); setNewFollowUpTitle(''); setNewFollowUpDate(''); }} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded text-[10px] transition-colors">Cancel</button>
                  <button type="button" onClick={() => {
                    if (!newFollowUpTitle.trim() || !newFollowUpDate) { alert('Follow-up Title and Date/Time are required'); return; }
                    setLeadFollowups(prev => [...prev, { title: newFollowUpTitle.trim(), agent: newFollowUpAgent, dueDateTime: new Date(newFollowUpDate).toISOString(), notified: false }]);
                    setHasFollowUp(false); setNewFollowUpTitle(''); setNewFollowUpDate('');
                  }} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] transition-colors font-semibold">Add</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/10">{leadMode === 'update' ? 'Update Lead' : 'Create Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
