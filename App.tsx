
import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  LayoutDashboard, 
  ArrowUpRight, 
  ShieldCheck, 
  PlusCircle,
  History,
  TrendingUp,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Zap,
  Lock,
  Search,
  User as UserIcon
} from 'lucide-react';
import { db } from './services/mockDatabase';
import { User, Website, Transaction } from './types';
import { analyzeWebsiteForDA } from './services/geminiService';
import { verifyBacklink, executeExchange } from './services/verificationService';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'dashboard' | 'add-site' | 'history'>('marketplace');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('linkauthority_auth');
    if (saved) return JSON.parse(saved);
    return null;
  });
  
  const [websites, setWebsites] = useState<Website[]>(db.getWebsites());
  const [transactions, setTransactions] = useState<Transaction[]>(db.getTransactions());
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleLoginSuccess = (response: any) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const googleUser = JSON.parse(jsonPayload);
      const user = db.findOrCreateUser(googleUser.name, googleUser.email, googleUser.picture);
      
      setCurrentUser(user);
      localStorage.setItem('linkauthority_auth', JSON.stringify(user));
      setNotification({ type: 'success', message: `Welcome back, ${user.name}!` });
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to process Google login.' });
    }
  };

  const handleDemoLogin = () => {
    const demoUser = db.findOrCreateUser('Demo Master', 'demo@linkauthority.io', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
    setCurrentUser(demoUser);
    localStorage.setItem('linkauthority_auth', JSON.stringify(demoUser));
    setNotification({ type: 'success', message: 'Logged in as Demo User with 100 bonus points!' });
  };

  const logout = () => {
    localStorage.removeItem('linkauthority_auth');
    setCurrentUser(null);
    window.location.reload(); 
  };

  useEffect(() => {
    if (!currentUser) {
      /* global google */
      // @ts-ignore
      if (typeof google !== 'undefined') {
        try {
          // @ts-ignore
          google.accounts.id.initialize({
            client_id: "241819621736-n1i653vpkd2cbm953k7b8q02gh5a3vc6.apps.googleusercontent.com", 
            callback: handleLoginSuccess,
            auto_select: false,
            use_fedcm_for_prompt: false 
          });

          // @ts-ignore
          google.accounts.id.renderButton(
            googleBtnRef.current,
            { theme: "outline", size: "large", width: "100%", text: "signin_with" }
          );
        } catch (err) {
          console.warn("Google Auth initialization skipped or failed.");
        }
      }
    }
  }, [currentUser]);

  const refreshData = () => {
    setWebsites(db.getWebsites());
    setTransactions(db.getTransactions());
    if (currentUser) {
      const refreshedUser = db.getUsers().find(u => u.id === currentUser.id);
      if (refreshedUser) setCurrentUser({ ...refreshedUser });
    }
  };

  const handleAddWebsite = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!currentUser) return;
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const domain = formData.get('domain') as string;
    const desc = formData.get('description') as string;

    const analysis = await analyzeWebsiteForDA(domain);
    
    const newSite: Website = {
      id: `w${Date.now()}`,
      ownerId: currentUser.id,
      domain,
      domainAuthority: analysis.da,
      description: desc || analysis.summary,
      category: analysis.niche
    };

    db.addWebsite(newSite);
    refreshData();
    setIsLoading(false);
    setActiveTab('dashboard');
    setNotification({ type: 'success', message: `Site added with DA ${analysis.da}!` });
  };

  const handleVerifyExchange = async (sourceWebsite: Website, targetWebsite: Website) => {
    if (!currentUser) return;
    setIsLoading(true);
    const simulatedSourceUrl = `https://${sourceWebsite.domain}/seo-guest-feature`;
    const result = await verifyBacklink(simulatedSourceUrl, targetWebsite.domain);
    
    if (result.success) {
      const tx: Transaction = {
        id: `tx${Date.now()}`,
        sourceWebsiteId: sourceWebsite.id,
        targetWebsiteId: targetWebsite.id,
        recipientUserId: targetWebsite.ownerId,
        providerUserId: sourceWebsite.ownerId,
        sourceUrl: simulatedSourceUrl,
        pointsTransferred: sourceWebsite.domainAuthority,
        status: 'pending',
        timestamp: new Date()
      };

      executeExchange(sourceWebsite.ownerId, targetWebsite.ownerId, sourceWebsite.domainAuthority, tx);
      setNotification({ type: 'success', message: `Link Verified! You earned ${sourceWebsite.domainAuthority} points.` });
    } else {
      setNotification({ type: 'error', message: result.error || 'Verification failed.' });
    }

    refreshData();
    setIsLoading(false);
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                <TrendingUp className="text-white" size={32} />
              </div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">LinkAuthority</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-slate-900 leading-[1.1]">
                Master the <span className="text-indigo-600">Authority</span> Economy.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                The world's first domain authority-based backlink exchange. Verified, transparent, and built for modern SEOs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <ShieldCheck className="text-indigo-600" size={18} /> Verified Links
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <Zap className="text-indigo-600" size={18} /> One Tap Auth
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <Search className="text-indigo-600" size={18} /> AI Analysis
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <ArrowUpRight className="text-indigo-600" size={18} /> High DA Reach
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-6 relative">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
              <Lock size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Sign in to Trade</h2>
              <p className="text-slate-500 text-sm">Join the network of authority builders</p>
            </div>
            
            <div className="w-full space-y-4">
              <div ref={googleBtnRef} className="w-full min-h-[40px] flex justify-center"></div>
              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-100"></div>
              </div>
              <button 
                onClick={handleDemoLogin}
                className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <UserIcon size={18} className="text-indigo-600" />
                Sign in as Demo User
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <nav className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <TrendingUp className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">LinkAuthority</span>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'marketplace' ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Globe size={20} /> Marketplace
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20} /> My Sites
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={20} /> Activity
          </button>
          <button 
            onClick={() => setActiveTab('add-site')}
            className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            <PlusCircle size={20} /> Register Site
          </button>
        </div>

        <div className="mt-auto">
          <div className="p-4 bg-slate-900 rounded-2xl text-white mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Trading Power</span>
              <Zap size={16} className="text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-bold">{currentUser.points} pts</div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-lg shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
            </div>
            <button onClick={logout} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors rounded-md">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {activeTab === 'marketplace' && 'Link Marketplace'}
              {activeTab === 'dashboard' && 'Publisher Dashboard'}
              {activeTab === 'add-site' && 'Add Website'}
              {activeTab === 'history' && 'Transaction History'}
            </h1>
          </div>
        </header>

        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all animate-in slide-in-from-right-4 ${notification.type === 'success' ? 'bg-white text-emerald-800 border-l-4 border-emerald-500' : 'bg-white text-rose-800 border-l-4 border-rose-500'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <XCircle className="text-rose-500" size={20} />}
            <span className="font-semibold">{notification.message}</span>
          </div>
        )}

        <div className="space-y-8">
          {activeTab === 'marketplace' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.filter(w => w.ownerId !== currentUser.id).map(site => (
                <div key={site.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="bg-slate-900 p-6 text-white relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                      <Globe size={80} />
                    </div>
                    <div className="relative">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{site.category}</span>
                      <h3 className="text-xl font-bold truncate mt-1">{site.domain}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Domain Authority</div>
                        <div className="text-2xl font-black text-slate-900">{site.domainAuthority} <span className="text-sm font-medium text-slate-400">DA</span></div>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-600 opacity-20" style={{ height: `${site.domainAuthority}%`, top: 'auto' }}></div>
                        <Zap size={18} className="text-indigo-600 z-10" />
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm mb-6 line-clamp-2 min-h-[40px] italic">"{site.description}"</p>
                    <button 
                      onClick={() => {
                        const userSites = websites.filter(w => w.ownerId === currentUser.id);
                        if (userSites.length === 0) {
                          setNotification({ type: 'error', message: 'Add a site to start trading!' });
                          return;
                        }
                        handleVerifyExchange(userSites[0], site);
                      }}
                      disabled={isLoading}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Request Backlink'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Sites" value={websites.filter(w => w.ownerId === currentUser.id).length} icon={Globe} color="bg-indigo-600" />
                <StatCard title="Earned Points" value={currentUser.points} icon={Zap} color="bg-amber-500" />
                <StatCard title="Verified Exchanges" value={transactions.filter(t => t.providerUserId === currentUser.id || t.recipientUserId === currentUser.id).length} icon={ShieldCheck} color="bg-emerald-500" />
              </div>
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Your Portfolio</h3>
                  <button onClick={() => setActiveTab('add-site')} className="text-indigo-600 font-bold text-sm hover:underline">Add New +</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Domain</th>
                        <th className="px-6 py-4">DA Score</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {websites.filter(w => w.ownerId === currentUser.id).map(site => (
                        <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{site.domain}</td>
                          <td className="px-6 py-4 font-black text-indigo-600">{site.domainAuthority}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add-site' && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
                <form onSubmit={handleAddWebsite} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400">Domain Root</label>
                    <input name="domain" required placeholder="example.com" className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400">Description</label>
                    <textarea name="description" rows={3} placeholder="Site summary..." className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:outline-none" />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze & Add Site'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                      <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Details</th>
                        <th className="px-6 py-4">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.filter(tx => tx.providerUserId === currentUser.id || tx.recipientUserId === currentUser.id).map(tx => {
                        const isProvider = tx.providerUserId === currentUser.id;
                        return (
                          <tr key={tx.id}>
                            <td className="px-6 py-4 text-xs">{new Date(tx.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-4 font-bold">{isProvider ? 'Provided Link' : 'Received Link'}</td>
                            <td className="px-6 py-4 font-black flex items-center gap-1">
                               {isProvider ? '+' : '-'}{tx.pointsTransferred} <Zap size={12} className="text-amber-500" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
