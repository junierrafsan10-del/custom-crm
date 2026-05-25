import { useState } from 'react';
import { 
  PhoneCall, 
  PhoneOff, 
  Delete, 
  Play, 
  Search,
  Volume2,
  Mic,
  MicOff,
  Disc,
  Send
} from 'lucide-react';

export default function Dialer() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [callMuted, setCallMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const [activeTab, setActiveTab] = useState('dialer'); // 'dialer' or 'bulk-sms'
  
  // Bulk SMS state
  const [smsTemplate, setSmsTemplate] = useState('');
  const [smsTarget, setSmsTarget] = useState('all-interested');
  const [smsStatus, setSmsStatus] = useState(null);

  const [callLogs, setCallLogs] = useState([
    { id: 1, name: 'Zunayed Chowdhury', number: '+8801712345678', type: 'outgoing', status: 'Connected', date: 'May 20, 2:15 PM', duration: '2m 14s', recordingUrl: '#' },
    { id: 2, name: 'Sabbir Ahmed', number: '+8801822334455', type: 'incoming', status: 'Connected', date: 'May 20, 11:30 AM', duration: '5m 48s', recordingUrl: '#' },
    { id: 3, name: 'Farhan Kabir', number: '+8801999888777', type: 'outgoing', status: 'Missed', date: 'May 19, 4:02 PM', duration: '--', recordingUrl: null },
    { id: 4, name: 'Tasnim Rahman', number: '+8801555444333', type: 'incoming', status: 'Connected', date: 'May 18, 5:40 PM', duration: '1m 20s', recordingUrl: '#' }
  ]);

  const handleDial = (num) => {
    setPhoneNumber(prev => prev + num);
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleStartCall = () => {
    if (!phoneNumber) return;
    setCallActive(true);
    setCallDuration(0);
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    setTimerId(interval);
  };

  const handleEndCall = () => {
    clearInterval(timerId);
    setCallActive(false);
    setCallMuted(false);
    
    // Add call to logs
    const formatTime = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s}s`;
    };
    
    setCallLogs([
      {
        id: callLogs.length + 1,
        name: 'Unknown Lead',
        number: phoneNumber,
        type: 'outgoing',
        status: 'Connected',
        date: 'Just Now',
        duration: formatTime(callDuration),
        recordingUrl: '#'
      },
      ...callLogs
    ]);
  };

  const handleSendBulkSMS = (e) => {
    e.preventDefault();
    if (!smsTemplate.trim()) return;
    
    setSmsStatus('sending');
    setTimeout(() => {
      setSmsStatus('sent');
      setSmsTemplate('');
      setTimeout(() => setSmsStatus(null), 3000);
    }, 1500);
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Columns (Dialer and SMS panel) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
          <button 
            onClick={() => setActiveTab('dialer')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'dialer' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Voice Dialer
          </button>
          <button 
            onClick={() => setActiveTab('bulk-sms')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'bulk-sms' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulk SMS
          </button>
        </div>

        {/* Tab Content: Dialer */}
        {activeTab === 'dialer' ? (
          <div className="p-6 rounded-xl glass-panel border border-slate-800 flex flex-col items-center">
            
            {/* Phone Screen display */}
            <div className="w-full bg-slate-950/80 rounded-xl p-4 border border-slate-850 mb-6 text-center">
              {callActive ? (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest animate-pulse">Call In Progress</span>
                  <div className="text-xl font-bold text-slate-100">{phoneNumber}</div>
                  <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                    <Disc size={12} className="text-red-500 animate-spin" /> Recording • {formatDuration(callDuration)}
                  </div>
                </div>
              ) : (
                <input 
                  type="text" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter number..." 
                  className="w-full bg-transparent text-xl font-bold text-center text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              )}
            </div>

            {/* Keypad Buttons */}
            {!callActive ? (
              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                  <button 
                    key={key}
                    onClick={() => handleDial(key)}
                    className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-lg font-semibold flex items-center justify-center border border-slate-850 hover:border-slate-700 transition-all"
                  >
                    {key}
                  </button>
                ))}
                
                {/* Extra buttons */}
                <div />
                <button 
                  onClick={handleStartCall}
                  disabled={!phoneNumber}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    phoneNumber 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10' 
                      : 'bg-slate-900/40 text-slate-700 cursor-not-allowed border border-slate-900'
                  }`}
                >
                  <PhoneCall size={22} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-16 h-16 rounded-full bg-slate-900/40 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all"
                >
                  <Delete size={20} />
                </button>
              </div>
            ) : (
              /* Active call controls */
              <div className="flex flex-col items-center space-y-6 w-full">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setCallMuted(!callMuted)}
                    className={`p-4 rounded-full border transition-all ${
                      callMuted 
                        ? 'bg-red-500/20 border-red-500 text-red-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {callMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all">
                    <Volume2 size={20} />
                  </button>
                </div>

                <button 
                  onClick={handleEndCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg shadow-red-600/10"
                >
                  <PhoneOff size={22} />
                </button>
              </div>
            )}

          </div>
        ) : (
          /* Tab Content: Bulk SMS */
          <div className="p-6 rounded-xl glass-panel border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Send Bulk SMS Campaign</h3>
            
            <form onSubmit={handleSendBulkSMS} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Target Audience</label>
                <select 
                  value={smsTarget}
                  onChange={(e) => setSmsTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all-interested">Interested Leads (24 Candidates)</option>
                  <option value="all-intake">Intake Leads (15 Candidates)</option>
                  <option value="all-qualified">Qualified Leads (86 Candidates)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">SMS Template</label>
                <textarea 
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  rows={5}
                  placeholder="e.g. Hello, thanks for your interest in our product. We are offering a 20% discount today. Please reply to schedule a call!" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={smsStatus === 'sending' || !smsTemplate.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
              >
                <Send size={14} /> 
                {smsStatus === 'sending' ? 'Sending SMS...' : 'Broadcast Bulk SMS'}
              </button>

              {smsStatus === 'sent' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs text-center font-medium">
                  Bulk Campaign Broadcasted Successfully!
                </div>
              )}
            </form>
          </div>
        )}

      </div>

      {/* Right Column (Call Logs & Recordings) */}
      <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-slate-800 flex flex-col h-[calc(100vh-8.5rem)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100">Call Logging & Recordings</h2>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2 text-slate-500" size={12} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="w-full pl-7 pr-3 py-1 bg-slate-950 border border-slate-850 rounded-md text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40 pr-1">
          {callLogs.map((log) => (
            <div key={log.id} className="py-3.5 flex items-center justify-between gap-4 group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs ${
                  log.type === 'incoming' ? 'text-emerald-400' : 'text-indigo-400'
                }`}>
                  {log.type === 'incoming' ? 'IN' : 'OUT'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{log.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{log.number} • {log.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-300 block">{log.duration}</span>
                  <span className={`text-[9px] ${
                    log.status === 'Connected' ? 'text-emerald-500' : 'text-red-500'
                  }`}>{log.status}</span>
                </div>

                {log.recordingUrl && (
                  <button className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-850 hover:border-slate-700 transition-all flex items-center justify-center">
                    <Play size={12} className="fill-indigo-400/20" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
