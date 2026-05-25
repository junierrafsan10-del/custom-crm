import { useState } from 'react';
import { put } from '../../utils/api';
import { Search, Send, Plus, Trash2, Edit2 } from 'lucide-react';

function ContactInfoPanel({ currentChat, matchingLead, onConvertLead, onUnpickChat, onDeleteChat, onRefresh, onToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentChat.name || '');
  const [editPhone, setEditPhone] = useState(currentChat.phone === 'N/A' ? '' : (currentChat.phone || ''));
  const [editEmail, setEditEmail] = useState(currentChat.email === 'N/A' ? '' : (currentChat.email || ''));
  const [editNotes, setEditNotes] = useState(currentChat.notes || '');

  const handleSaveContactDetails = () => {
    if (!currentChat || currentChat.id === 'placeholder') return;
    put('/api/conversations/' + currentChat._id, {
      name: editName,
      phone: editPhone,
      email: editEmail,
      notes: editNotes
    })
    .then(data => {
      if (data.success) {
        setIsEditing(false);
        onRefresh();
        onToast('Contact details saved!');
      } else {
        alert('Failed to save contact details: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Error saving contact details:', err);
      alert('Could not reach backend server to save contact details.');
    });
  };

  return isEditing ? (
    <div className="space-y-6">
      <div className="text-center">
        {currentChat.pictureUrl ? (
          <img src={currentChat.pictureUrl} alt={editName} className="w-16 h-16 rounded-full object-cover border border-indigo-500/30 mx-auto" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-600/15 border border-indigo-500/30 mx-auto flex items-center justify-center font-bold text-lg text-indigo-400">
            {(editName && editName.charAt(0)) || '?'}
          </div>
        )}
        <h4 className="text-xs font-semibold text-slate-400 mt-3">Edit Profile</h4>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">Name</label>
          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25" placeholder="Enter name" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">Phone</label>
          <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25" placeholder="Enter phone number" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">Email</label>
          <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25" placeholder="Enter email address" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">Additional Info</label>
          <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={4} className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 resize-none" placeholder="Add additional notes here..." />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={handleSaveContactDetails} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-600/15">Save</button>
        <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold transition-all">Cancel</button>
      </div>
    </div>
  ) : (
    <div className="space-y-6 flex flex-col h-full justify-between">
      <div className="space-y-6">
        <div className="text-center">
          {currentChat.pictureUrl ? (
            <img src={currentChat.pictureUrl} alt={currentChat.name} className="w-16 h-16 rounded-full object-cover border border-slate-800 mx-auto" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto flex items-center justify-center font-bold text-lg text-slate-300">
              {(currentChat.name && currentChat.name.charAt(0)) || '?'}
            </div>
          )}
          <h4 className="text-sm font-bold text-slate-200 mt-3">{currentChat.name}</h4>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-medium border border-indigo-500/20 mt-1 inline-block">Prospecting</span>
        </div>

        <div className="border-t border-slate-800/60 pt-6 space-y-4">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Phone</span>
            <span className="text-xs text-slate-300 font-medium">{currentChat.phone || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Email</span>
            <span className="text-xs text-slate-300 font-medium">{currentChat.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Integration Source</span>
            <span className="text-xs text-slate-300 font-medium capitalize">{currentChat.platform}</span>
          </div>
          {currentChat.notes && (
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Additional Info</span>
              <p className="text-xs text-slate-400 font-medium leading-relaxed bg-slate-900/30 p-2 rounded border border-slate-800/40 whitespace-pre-line mt-1">{currentChat.notes}</p>
            </div>
          )}
          {currentChat.unpickHistory && currentChat.unpickHistory.length > 0 && (
            <div className="mt-4">
              <span className="text-[10px] text-amber-500 block uppercase font-semibold">Unpick History</span>
              <div className="mt-1.5 bg-slate-900/30 p-2 rounded border border-slate-800/40 space-y-2.5 max-h-36 overflow-y-auto">
                {currentChat.unpickHistory.map((history, idx) => (
                  <div key={idx} className="flex flex-col text-[10px] text-slate-400 border-b border-slate-800/20 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-300 truncate max-w-[120px]">{history.agent}</span>
                      <span className="text-[9px] text-slate-500">{new Date(history.timestamp).toLocaleString()}</span>
                    </div>
                    {history.reason && (
                      <div className="text-[9px] text-slate-500 italic mt-1 pl-2 border-l border-amber-500/40">Reason: {history.reason}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-800/60 pt-6">
        <button onClick={() => setIsEditing(true)} className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all mb-1">Edit Details</button>
        <button onClick={onConvertLead} className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold transition-all">{matchingLead ? 'Update Lead' : 'Convert to Lead'}</button>
        <button onClick={onUnpickChat} className="w-full py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold transition-all">Unpick Ticket</button>
        <button onClick={onDeleteChat} className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-all">Delete Ticket (Remove)</button>
      </div>
    </div>
  );
}

export default function ConversationDetail({
  currentChat,
  activeChat,
  matchingLead,
  templates,
  setTemplates,
  isAddingTemplate,
  setIsAddingTemplate,
  handleSelectTemplate,
  onRefresh,
  onToast,
  onConvertLead,
  onUnpickChat,
  onDeleteChat
}) {
  const [rightSidebarTab, setRightSidebarTab] = useState('info');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateText, setTemplateText] = useState('');

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!templateTitle.trim() || !templateText.trim()) return;
    if (editingTemplateId) {
      setTemplates(prev => prev.map(t => t.id === editingTemplateId ? { ...t, title: templateTitle.trim(), text: templateText.trim() } : t));
      setEditingTemplateId(null);
    } else {
      setTemplates(prev => [...prev, { id: Date.now().toString(), title: templateTitle.trim(), text: templateText.trim() }]);
    }
    setTemplateTitle('');
    setTemplateText('');
    setIsAddingTemplate(false);
  };

  if (currentChat.id === 'placeholder') {
    return (
      <div className="w-80 border-l border-slate-800 p-6 hidden xl:block bg-slate-900/20 overflow-y-auto">
        <div className="text-center py-8 text-slate-500 text-xs">Select a chat to view details.</div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-slate-800 p-6 hidden xl:block bg-slate-900/20 overflow-y-auto">
      <div className="flex flex-col h-full">
        <div className="flex border-b border-slate-800/80 mb-6 flex-shrink-0">
          <button
            onClick={() => setRightSidebarTab('info')}
            className={`flex-1 pb-3 text-[11px] font-semibold border-b-2 transition-all ${rightSidebarTab === 'info' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Contact Info
          </button>
          <button
            onClick={() => setRightSidebarTab('templates')}
            className={`flex-1 pb-3 text-[11px] font-semibold border-b-2 transition-all ${rightSidebarTab === 'templates' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Templates ({templates.length})
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {rightSidebarTab === 'info' ? (
            <ContactInfoPanel key={activeChat} currentChat={currentChat} matchingLead={matchingLead} onConvertLead={onConvertLead} onUnpickChat={onUnpickChat} onDeleteChat={onDeleteChat} onRefresh={onRefresh} onToast={onToast} />
          ) : (
            <div className="space-y-4 h-full flex flex-col">
              {(isAddingTemplate || editingTemplateId) ? (
                <form onSubmit={handleSaveTemplate} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3 flex-shrink-0">
                  <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">{editingTemplateId ? 'Edit Template' : 'Create Template'}</h4>
                  <div>
                    <label className="text-[9px] text-slate-500 block uppercase font-semibold mb-1">Title</label>
                    <input type="text" placeholder="e.g. Greeting" value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500" required />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block uppercase font-semibold mb-1">Content</label>
                    <textarea placeholder="Type template message..." value={templateText} onChange={e => setTemplateText(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 resize-none focus:outline-none focus:border-indigo-500" required />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => { setIsAddingTemplate(false); setEditingTemplateId(null); setTemplateTitle(''); setTemplateText(''); }} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded text-[10px] transition-colors">Cancel</button>
                    <button type="submit" className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] transition-colors font-semibold">Save</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => { setIsAddingTemplate(true); setEditingTemplateId(null); setTemplateTitle(''); setTemplateText(''); }} className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 flex-shrink-0">
                  <Plus size={14} /> Add Template
                </button>
              )}

              <div className="relative flex-shrink-0">
                <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                <input type="text" placeholder="Search templates..." value={templateSearchQuery} onChange={e => setTemplateSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {templates.filter(t => t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) || t.text.toLowerCase().includes(templateSearchQuery.toLowerCase())).map(tpl => (
                  <div key={tpl.id} className="p-3 bg-slate-900/40 border border-slate-800/40 rounded-xl hover:border-indigo-500/30 transition-all group flex flex-col gap-2">
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{tpl.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">{tpl.text}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800/30 pt-2 mt-1">
                      <button type="button" onClick={() => handleSelectTemplate(tpl.text)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors">
                        <Send size={10} /> Use Template
                      </button>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => { setEditingTemplateId(tpl.id); setIsAddingTemplate(false); setTemplateTitle(tpl.title); setTemplateText(tpl.text); }} className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors" title="Edit template">
                          <Edit2 size={11} />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTemplates(prev => prev.filter(t => t.id !== tpl.id)); }} className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors" title="Delete template">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {templates.filter(t => t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) || t.text.toLowerCase().includes(templateSearchQuery.toLowerCase())).length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-[11px]">No templates found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
