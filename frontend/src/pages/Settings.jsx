import { useState, useEffect } from 'react';
import { get, post } from '../utils/api';
import { 
  MessageSquare, 
  Phone, 
  Shield, 
  Eye,
  EyeOff,
  Save,
  CheckCircle2
} from 'lucide-react';

const Facebook = (props) => (
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

const WhatsApp = (props) => (
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
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export default function Settings({ metaConnections, refreshStatus }) {
  const [showSecret, setShowSecret] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('Fetching active tunnel URL...');

  useEffect(() => {
    get('/api/tunnel-url')
      .then(data => {
        if (data.success && data.webhookUrl) {
          setWebhookUrl(data.webhookUrl);
        }
      })
      .catch(err => {
        console.error('Error fetching tunnel URL:', err);
        setWebhookUrl(import.meta.env.VITE_API_URL + '/api/webhooks/meta (Tunnel disconnected)');
      });
  }, []);

  const team = [
    { name: 'Majharul Islam Sifat', role: 'Admin', email: 'sifat@example.com', privileges: 'Full System Access, Delete, Settings' },
    { name: 'Support Member A', role: 'Support Member', email: 'member.a@example.com', privileges: 'View Assigned Leads, Reply, Call' },
    { name: 'Support Member B', role: 'Support Member', email: 'member.b@example.com', privileges: 'View Assigned Leads, Reply, Call' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  // Meta OAuth integration — live integrations calling the Express backend endpoints
  const handleMetaConnect = () => {
    get('/api/auth/meta-url')
      .then(data => {
        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to retrieve Meta Login URL: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Could not reach backend authentication server. Please ensure the backend server is running on port 5000.');
      });
  };

  const handleMetaDisconnect = (platform) => {
    const platformLabel = platform === 'facebook' ? 'Facebook Page' : platform === 'whatsapp' ? 'WhatsApp Business' : 'Meta accounts';
    if (!window.confirm(`Are you sure you want to disconnect your ${platformLabel}?`)) {
      return;
    }
    
    post('/api/auth/disconnect', { platform })
      .then(data => {
        if (data.success) {
          refreshStatus();
        } else {
          alert('Failed to disconnect ' + platformLabel + ': ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Could not reach backend. Disconnection failed.');
      });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Left Columns (API Settings Forms) */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Facebook Page Integration Section */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Facebook className="text-blue-500" size={20} />
              <h2 className="text-base font-bold text-slate-100">Facebook Page Connection</h2>
            </div>
            
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
              metaConnections?.facebookConnected 
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              {metaConnections?.facebookConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {metaConnections?.facebookConnected ? (
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Connected Facebook Page</h3>
                  <div className="mt-2 space-y-1.5 text-xs text-slate-400">
                    <p>
                      <span className="text-slate-500">Page Name:</span>{' '}
                      <span className="text-slate-300 font-semibold">{metaConnections.facebookPageName}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Page ID:</span>{' '}
                      <span className="text-slate-300 font-semibold">{metaConnections.facebookPageId}</span>
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleMetaDisconnect('facebook')}
                  className="px-3 py-1.5 bg-red-650/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white text-xs font-semibold rounded-lg transition-all self-start sm:self-center"
                >
                  Disconnect Facebook
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 border border-dashed border-slate-800 rounded-lg bg-slate-900/10 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400 font-medium">Connect your Facebook Page to receive and reply to user messages directly in the CRM.</p>
              <button 
                onClick={handleMetaConnect}
                className="flex items-center gap-1.5 px-4 py-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/10"
              >
                <Facebook size={14} /> Connect Facebook Page
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Business Integration Section */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <WhatsApp className="text-emerald-500" size={20} />
              <h2 className="text-base font-bold text-slate-100">WhatsApp Business Connection</h2>
            </div>
            
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
              metaConnections?.whatsappConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              {metaConnections?.whatsappConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {metaConnections?.whatsappConnected ? (
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Connected WhatsApp Profile</h3>
                  <div className="mt-2 space-y-1.5 text-xs text-slate-400">
                    <p>
                      <span className="text-slate-500">Account Name:</span>{' '}
                      <span className="text-slate-300 font-semibold">{metaConnections.whatsappName}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Phone Number:</span>{' '}
                      <span className="text-slate-300 font-semibold">{metaConnections.whatsappPhone}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Phone Number ID:</span>{' '}
                      <span className="text-slate-300 font-semibold">{metaConnections.whatsappPhoneNumberId}</span>
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleMetaDisconnect('whatsapp')}
                  className="px-3 py-1.5 bg-red-650/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white text-xs font-semibold rounded-lg transition-all self-start sm:self-center"
                >
                  Disconnect WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 border border-dashed border-slate-800 rounded-lg bg-slate-900/10 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400 font-medium">Connect your WhatsApp Business Account to send and receive real messages using the WhatsApp Cloud API.</p>
              <button 
                onClick={handleMetaConnect}
                className="flex items-center gap-1.5 px-4 py-2 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-emerald-600/10"
              >
                <WhatsApp size={14} /> Connect WhatsApp Business
              </button>
            </div>
          )}

          {/* Technical Metadata Config */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-semibold"
            >
              {showTechnicalDetails ? 'Hide technical webhooks & credentials' : 'Show technical webhooks & credentials'}
            </button>

            {showTechnicalDetails && (
              <div className="mt-4 p-4 rounded-lg bg-slate-950/50 border border-slate-850 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Facebook Page ID</label>
                    <input 
                      type="text" 
                      value={metaConnections?.facebookPageId || ''} 
                      readOnly
                      placeholder="Not Connected"
                      className="w-full px-3 py-2 bg-slate-950/40 border border-slate-850 rounded-lg text-xs text-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">WhatsApp Business Account ID</label>
                    <input 
                      type="text" 
                      value={metaConnections?.whatsappBusinessId || ''} 
                      readOnly
                      placeholder="Not Connected"
                      className="w-full px-3 py-2 bg-slate-950/40 border border-slate-850 rounded-lg text-xs text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Graph API Access Token</label>
                  <div className="relative">
                    <input 
                      type={showSecret ? 'text' : 'password'} 
                      value={metaConnections?.accessToken || ''} 
                      readOnly
                      placeholder="Not Connected"
                      className="w-full pl-3 pr-10 py-2 bg-slate-950/40 border border-slate-850 rounded-lg text-xs text-slate-500 focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowSecret(!showSecret)}
                      disabled={!metaConnections?.accessToken}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
                    >
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Webhook Verification Token</label>
                    <input 
                      type="text" 
                      value="my_custom_crm_secret_token_123" 
                      readOnly
                      className="w-full px-3 py-2 bg-slate-950/40 border border-slate-850 rounded-lg text-xs text-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Webhook Callback URL (Tunnels)</label>
                    <input 
                      type="text" 
                      value={webhookUrl} 
                      readOnly
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Copy this URL and paste it in the Meta Developer Dashboard.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Third-Party APIs settings (Call & SMS) */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800">
          <div className="flex items-center gap-2 mb-6">
            <Phone className="text-purple-500" size={20} />
            <h2 className="text-base font-bold text-slate-100">Third-Party SMS & Call API Configuration</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Twilio Account SID</label>
                <input 
                  type="text" 
                  defaultValue="AC8237498237498237492348" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Twilio Auth Token</label>
                <input 
                  type="password" 
                  defaultValue="dummy_auth_token" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Calling Number (Caller ID)</label>
                <input 
                  type="text" 
                  defaultValue="+18554923842" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">SMS Sender Name</label>
                <input 
                  type="text" 
                  defaultValue="CRM-ALERT" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/60 mt-6">
              <button 
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg"
              >
                <Save size={14} /> Save API settings
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Right Column (User Roles & Permissions) */}
      <div className="p-6 rounded-xl glass-panel border border-slate-800 h-fit space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="text-indigo-400" size={20} />
          <h2 className="text-base font-bold text-slate-100">User Roles & Access Control</h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Admin accounts possess unrestricted control, database mutation privileges, and API configurations. Support Member accounts have access limited to lead communication, message replying, and calling.
        </p>

        <div className="space-y-4 pt-4 border-t border-slate-800/60">
          {team.map((member, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-800 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200">{member.name}</h4>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  member.role === 'Admin' 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {member.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{member.email}</p>
              <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-900 pt-2">{member.privileges}</p>
            </div>
          ))}
        </div>

        {savedStatus && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs text-center font-medium flex items-center justify-center gap-1.5 animate-pulse">
            <CheckCircle2 size={14} /> Configuration saved and updated successfully!
          </div>
        )}
      </div>

    </div>
  );
}
