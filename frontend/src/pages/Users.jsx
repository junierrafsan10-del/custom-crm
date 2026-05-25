import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { get, post } from '../utils/api';
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare, 
  Edit2, 
  ExternalLink,
  Calendar,
  Layers,
  Save,
  Database
} from 'lucide-react';
import FacebookIcon from '../components/icons/FacebookIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';

const CustomerProfile = memo(function CustomerProfile({ customer, messages, onRefresh, onToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customer.name || '');
  const [editPhone, setEditPhone] = useState(customer.phone || '');
  const [editEmail, setEditEmail] = useState(customer.email || '');
  const [editNotes, setEditNotes] = useState(customer.notes || '');

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!customer) return;

    post('/api/customers/update', {
      id: customer.id,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      notes: editNotes.trim()
    })
      .then(data => {
        if (data.success) {
          setIsEditing(false);
          onToast('Profile updated successfully!');
          onRefresh();
        } else {
          alert('Failed to update profile: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error('Error updating profile:', err);
        alert('Could not update customer details.');
      });
  };

  const handleQuickSaveNotes = () => {
    if (!customer) return;
    post('/api/customers/update', {
      id: customer.id,
      notes: editNotes.trim()
    })
      .then(data => {
        if (data.success) {
          onToast('Notes saved!');
          onRefresh();
        } else {
          alert('Failed to save notes: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error('Error saving notes:', err);
        alert('Could not save notes.');
      });
  };

  const handleOpenInChat = () => {
    if (customer.participantId) {
      localStorage.setItem('crm_active_chat_id', customer.participantId);
      window.location.href = '/chat';
    }
  };

  const customerMessages = customer && customer.participantId
    ? messages.filter(m => m.senderId === customer.participantId || m.recipientId === customer.participantId)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Profile Card Header Glass Panel */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 relative overflow-hidden">
        {/* Visual Backdrop Radial Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
          
          {/* Left Avatar & Name Bio */}
          <div className="flex items-center gap-4">
            {customer.pictureUrl ? (
              <img 
                src={customer.pictureUrl} 
                alt={customer.name} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-800 shadow-xl shadow-black/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-indigo-400 font-bold text-2xl shadow-xl shadow-black/30">
                {customer.name ? customer.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-100">{customer.name}</h2>
                
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border capitalize flex items-center gap-1 ${
                  customer.platform === 'whatsapp'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : customer.platform === 'facebook'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {customer.platform === 'whatsapp' ? (
                    <WhatsAppIcon size={10} />
                  ) : customer.platform === 'facebook' ? (
                    <FacebookIcon size={10} />
                  ) : (
                    <Phone size={10} />
                  )}
                  {customer.platform || 'facebook'}
                </span>
              </div>
              
              <p className="text-xs text-slate-400 mt-1 font-semibold flex items-center gap-1.5">
                <Clock size={11} className="text-indigo-400" />
                Registered on {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Actions buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                isEditing 
                  ? 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300' 
                  : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
              }`}
            >
              {isEditing ? (
                <>Cancel</>
              ) : (
                <><Edit2 size={13} /> Edit Profile</>
              )}
            </button>

            {customer.participantId && (
              <button
                onClick={handleOpenInChat}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <MessageSquare size={13} className="text-indigo-400" /> Open in Chat <ExternalLink size={11} className="text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Edit Form Fields Block */}
        {isEditing && (
          <form onSubmit={handleEditSubmit} className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Edit Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Administrative Notes</label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={3}
                placeholder="Add background context, exchange details, remarks..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-lg shadow-indigo-600/10 transition-colors"
              >
                <Save size={13} /> Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Detailed Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Details Contact Block Card */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-300 tracking-wide pb-3 border-b border-slate-850 uppercase flex items-center gap-2">
            <User size={13} className="text-indigo-400" /> Contact Info Card
          </h3>

          <div className="space-y-3.5 py-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Phone size={11} className="text-slate-400" /> Phone
              </span>
              <span className="text-slate-200 font-bold">{customer.phone || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Mail size={11} className="text-slate-400" /> Email
              </span>
              <span className="text-slate-200 font-bold truncate max-w-[200px]">{customer.email || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Layers size={11} className="text-slate-400" /> Connection Platform
              </span>
              <span className="text-slate-200 font-bold capitalize">{customer.platform || 'facebook'}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Database size={11} className="text-slate-400" /> Participant ID
              </span>
              <span className="text-slate-400 font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-900">{customer.participantId || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Calendar size={11} className="text-slate-400" /> Date Created
              </span>
              <span className="text-slate-200 font-bold">
                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Container Block */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-300 tracking-wide pb-3 border-b border-slate-850 uppercase flex items-center gap-2">
            <Edit2 size={13} className="text-indigo-400" /> Customer Notes
          </h3>
          
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Add specific comments, preferences, delivery notes..."
              className="w-full flex-1 bg-slate-950/70 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none min-h-[110px]"
            ></textarea>
            
            <button
              onClick={handleQuickSaveNotes}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-[11px] font-bold rounded-xl transition-all self-end flex items-center gap-1"
            >
              <Save size={12} className="text-indigo-400" /> Save Notes
            </button>
          </div>
        </div>

      </div>

      {/* Message Audit Log Panel */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800">
        <div className="pb-3 border-b border-slate-850 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 tracking-wide uppercase flex items-center gap-2">
            <MessageSquare size={13} className="text-indigo-400" /> Recent Messages Audit Log
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
            {customerMessages.length} total messages
          </span>
        </div>

        <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {customerMessages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold leading-relaxed">
              No message history found for this customer.
            </div>
          ) : (
            customerMessages.slice(-8).map((msg, i) => {
              const isClient = msg.senderId === customer.participantId;
              const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div 
                  key={msg._id || i}
                  className={`flex flex-col gap-1 p-3 rounded-xl border max-w-[85%] ${
                    isClient 
                      ? 'bg-slate-900/60 border-slate-850 text-slate-300 self-start mr-auto' 
                      : 'bg-indigo-650/10 border-indigo-500/20 text-slate-200 self-end ml-auto'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                      {isClient ? 'Customer' : 'Agent Response'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold whitespace-nowrap">
                      {dateStr} {timeStr}
                    </span>
                  </div>
                  
                  <p className="text-xs leading-relaxed mt-1 font-medium select-text break-words">
                    {msg.text && msg.text.startsWith('Attachment:') ? (
                      <span className="text-indigo-400 flex items-center gap-1.5 italic text-[11px]">
                        <ExternalLink size={10} /> Shared an Attachment
                      </span>
                    ) : (
                      msg.text
                    )}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
});

export default function Users() {
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all'); // 'all', 'facebook', 'whatsapp'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchData = useCallback(() => {
    get('/api/customers')
      .then(data => {
        if (data.success && data.data) {
          const formatted = data.data.map(c => ({
            ...c,
            id: c._id || c.id
          }));
          setCustomers(formatted);
          
          if (formatted.length > 0 && !selectedCustomerId) {
            setSelectedCustomerId(formatted[0].id);
          }
        }
      })
      .catch(err => console.error('Failed to fetch customers:', err))
      .finally(() => setLoading(false));

    get('/api/messages')
      .then(data => {
        if (data.success) {
          setMessages(data.messages || []);
        }
      })
      .catch(err => console.error('Failed to fetch messages:', err));
  }, [selectedCustomerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => customers.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term));
    const matchesPlatform = platformFilter === 'all' || 
      (c.platform && c.platform.toLowerCase() === platformFilter);
    return matchesSearch && matchesPlatform;
  }), [customers, searchTerm, platformFilter]);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col gap-6 font-sans">
      
      {/* Premium Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Users & Customer Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage customer profiles created automatically from Meta integrations, modify details, and view message logs.
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 self-start md:self-center"
        >
          <Clock size={13} className="text-indigo-400" /> Sync Directory
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - User Cards Directory List (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Search & Filters Glass Container */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search users name, phone, email..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>

            {/* Platform Filter Tabs */}
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/50">
              {['all', 'facebook', 'whatsapp'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setPlatformFilter(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize ${
                    platformFilter === tab 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  {tab === 'all' ? 'All Platforms' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Users Card List */}
          <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-3.5 border-b border-slate-850 bg-slate-900/10 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">PROFILES ({filteredCustomers.length})</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">{customers.length} total</span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-850/50">
              {loading ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-800 border-t-indigo-500 animate-spin"></div>
                  <span className="text-xs text-slate-500 font-medium">Loading user profiles...</span>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs font-semibold leading-relaxed">
                  No matching user profiles found.
                </div>
              ) : (
                filteredCustomers.map(customer => {
                  const isSelected = customer.id === selectedCustomerId;
                  const cleanPhone = customer.phone || 'N/A';
                  const platformLabel = customer.platform || 'facebook';

                  return (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-900/10 to-transparent' 
                          : 'hover:bg-slate-900/30 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {customer.pictureUrl ? (
                          <img 
                            src={customer.pictureUrl} 
                            alt={customer.name} 
                            className="w-10 h-10 rounded-xl object-cover border border-slate-850"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-indigo-400 font-bold text-sm">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        {/* Integration source indicator badge */}
                        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
                          {platformLabel === 'whatsapp' ? (
                            <WhatsAppIcon size={9} className="text-emerald-400" />
                          ) : platformLabel === 'facebook' ? (
                            <FacebookIcon size={9} className="text-blue-400" />
                          ) : (
                            <Phone size={9} className="text-amber-400" />
                          )}
                        </div>
                      </div>

                      {/* Info Summary */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{customer.name}</h4>
                          <span className="text-[9px] text-slate-500 whitespace-nowrap">
                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">{cleanPhone}</p>
                        {customer.notes && (
                          <p className="text-[9px] text-slate-500 truncate mt-1 italic">"{customer.notes}"</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - User Profile Detail Viewer (8 Cols) */}
        <div className="lg:col-span-8">
          
          {selectedCustomer ? (
            <CustomerProfile key={selectedCustomerId} customer={selectedCustomer} messages={messages} onRefresh={fetchData} onToast={triggerToast} />
          ) : (
            /* Fallback display when no customer selected */
            <div className="h-[400px] rounded-2xl glass-panel border border-slate-800 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
                <User size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-200">No Profile Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-medium">
                Please select a customer profile from the directory on the left to inspect contact details, update administrative fields, or check logs.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Floating premium Success/Info Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-indigo-500/30 text-indigo-300 px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl shadow-indigo-950/20 flex items-center gap-3 z-50 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}