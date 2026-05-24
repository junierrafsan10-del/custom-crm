import { useState } from 'react';
import { Send, Plus, Trash2, Zap } from 'lucide-react';

export default function MessageInput({
  onSendMessage,
  onSelectTemplate,
  messageText,
  onMessageTextChange,
  templates,
  setTemplates,
  showTemplates,
  setShowTemplates,
  isAddingTemplate,
  setIsAddingTemplate,
  activeChat,
  currentChat
}) {
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');

  const handleDeleteTemplate = (id, e) => {
    e.stopPropagation();
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateTitle.trim() || !newTemplateText.trim()) return;
    const newTpl = {
      id: Date.now().toString(),
      title: newTemplateTitle.trim(),
      text: newTemplateText.trim()
    };
    setTemplates(prev => [...prev, newTpl]);
    setNewTemplateTitle('');
    setNewTemplateText('');
    setIsAddingTemplate(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat || currentChat.id === 'placeholder') return;
    onSendMessage();
  };

  return (
    <div className="relative">
      {showTemplates && (
        <div className="absolute bottom-16 left-4 w-80 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl z-50 flex flex-col max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/60 mb-2">
            <h4 className="text-xs font-semibold text-slate-200">Quick Reply Templates</h4>
            <button
              type="button"
              onClick={() => setIsAddingTemplate(!isAddingTemplate)}
              className="p-1 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors"
              title="Add new template"
            >
              <Plus size={14} />
            </button>
          </div>

          {isAddingTemplate ? (
            <form onSubmit={handleAddTemplate} className="space-y-2.5 mb-2.5 py-1 border-b border-slate-800/40 pb-2">
              <div>
                <input
                  type="text"
                  placeholder="Template Title"
                  value={newTemplateTitle}
                  onChange={e => setNewTemplateTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Message Content"
                  value={newTemplateText}
                  onChange={e => setNewTemplateText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-300 resize-none focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingTemplate(false)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded text-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] transition-colors font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          ) : null}

          <div className="space-y-1.5 overflow-y-auto max-h-56 divide-y divide-slate-800/40">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl.text)}
                className="p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer group flex justify-between items-start gap-2 text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="text-[11px] font-semibold text-slate-300 group-hover:text-indigo-400 transition-colors">{tpl.title}</h5>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{tpl.text}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all rounded hover:bg-slate-800"
                  title="Delete template"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-4">No templates. Click '+' to add one.</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800/80 flex items-center gap-2 bg-slate-900/10">
        <input
          type="text"
          value={messageText}
          onChange={(e) => onMessageTextChange(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-4 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className={`p-2 rounded-lg transition-colors ${showTemplates ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-slate-800/60 text-slate-500 hover:text-slate-300'}`}
          title="Quick Replies"
        >
          <Zap size={16} />
        </button>
        <button type="submit" className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
