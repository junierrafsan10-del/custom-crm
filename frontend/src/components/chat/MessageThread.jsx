import { useRef, useEffect } from 'react';
import { Phone, MoreVertical, Paperclip } from 'lucide-react';

function renderMessageContent(text, isAgent) {
  if (!text) return null;
  const match = text.match(/^Attachment: \[(.*?)\]\((.*?)\)$/);
  if (match) {
    const fileName = match[1];
    const fileUrl = match[2];
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);

    if (isImage) {
      return (
        <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-w-[280px] shadow-lg shadow-black/20 hover:border-indigo-500/50 hover:shadow-indigo-500/5 transition-all duration-200 mt-1">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-h-64 w-full object-contain cursor-pointer transition-all duration-300 hover:scale-[1.01]"
            onClick={() => window.open(fileUrl, '_blank')}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2.5 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-300 truncate font-semibold flex-1">{fileName}</span>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded bg-slate-900/90 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
              title="Open original"
            >
              <Paperclip size={10} />
            </a>
          </div>
        </div>
      );
    }

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 max-w-[280px] mt-1 text-left ${
          isAgent
            ? 'bg-indigo-700/20 border-indigo-500/20 hover:border-indigo-400/40 hover:bg-indigo-700/30 text-indigo-100'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 text-slate-300'
        }`}
      >
        <div className="p-1.5 rounded-lg bg-slate-950/40 text-indigo-400 flex-shrink-0">
          <Paperclip size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold truncate leading-tight">{fileName}</p>
          <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Click to view document</p>
        </div>
      </a>
    );
  }
  return <p className="leading-relaxed">{text}</p>;
}

export default function MessageThread({ messages, currentChat }) {
  const messageBodyRef = useRef(null);

  const scrollToBottom = () => {
    if (messageBodyRef.current) {
      messageBodyRef.current.scrollTop = messageBodyRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col bg-slate-950/20">
      <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/10">
        <div className="flex items-center gap-3">
          {currentChat.pictureUrl ? (
            <img
              src={currentChat.pictureUrl}
              alt={currentChat.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-800"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-xs text-slate-300">
              {currentChat.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold text-slate-200">{currentChat.name}</h3>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              {currentChat.platform === 'facebook' ? 'Facebook Messenger' : 'WhatsApp Business'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <Phone size={14} />
          </button>
          <button className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      <div ref={messageBodyRef} className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-xs ${
                isAgent
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-800/30'
              }`}>
                {renderMessageContent(msg.text, isAgent)}
                <span className={`block text-[9px] mt-1 text-right ${
                  isAgent ? 'text-indigo-200' : 'text-slate-500'
                }`}>{msg.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
