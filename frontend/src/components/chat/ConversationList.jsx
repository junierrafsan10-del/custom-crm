import { Search, MessageSquare } from 'lucide-react';

function FacebookIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function ConversationList({ chats, activeChat, onSelectChat }) {
  return (
    <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/20">
      <div className="p-4 border-b border-slate-800/60">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full p-4 flex gap-3 text-left transition-colors ${
                activeChat === chat.id
                  ? 'bg-slate-800/40 border-l-2 border-indigo-500'
                  : 'hover:bg-slate-800/10'
              }`}
            >
              <div className="relative flex-shrink-0">
                {chat.pictureUrl ? (
                  <img
                    src={chat.pictureUrl}
                    alt={chat.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-slate-300">
                    {chat.name.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-900">
                  {chat.platform === 'facebook' ? (
                    <FacebookIcon size={12} className="text-blue-500 fill-blue-500" />
                  ) : (
                    <MessageSquare size={12} className="text-emerald-500 fill-emerald-500" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-semibold text-slate-200 truncate">{chat.name}</h3>
                  <span className="text-[10px] text-slate-500">{chat.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{chat.lastMsg}</p>
              </div>

              {chat.unread > 0 && (
                <div className="flex-shrink-0 flex items-center">
                  <span className="bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {chat.unread}
                  </span>
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs flex flex-col gap-2 mt-12 bg-slate-950/20 rounded-xl mx-4 border border-dashed border-slate-800/40">
            <MessageSquare className="mx-auto opacity-30 text-indigo-400" size={24} />
            <p className="font-semibold text-slate-400">No active chats in your inbox</p>
            <p className="text-[10px] text-slate-600">Please go to the Tickets Portal and pick a ticket to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
