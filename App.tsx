import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  LayoutDashboard, 
  PlusCircle, 
  Zap, 
  History, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  LogOut,
  Search,
  ChevronRight,
  Database
} from 'lucide-react';
import { db } from './services/mockDatabase.ts';
import { User, Website, Transaction } from './types.ts';
import { analyzeDomain } from './services/geminiService.ts';
import { verifyBacklink, executeExchange } from './services/verificationService.ts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'dashboard' | 'history' | 'add'>('marketplace');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('la_auth');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [websites, setWebsites] = useState<Website[]>(db.getWebsites());
  const [transactions, setTransactions] = useState<Transaction[]>(db.getTransactions());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // UI Refresher
  const refresh = () => {
    setWebsites(db.getWebsites());
    setTransactions(db.getTransactions());
    if (currentUser) {
      const freshUser = db.getUsers().find(u => u.id === currentUser.id);
      if (freshUser) setCurrentUser({ ...freshUser });
    }
  };

  const handleDemoLogin = () => {
    const demoUser = db.findOrCreateUser('SEO Master', 'demo@linkauthority.io', 'https://api.dicebear.com/7.x/avataaars/svg?seed=SEO');
    setCurrentUser(demoUser);
    localStorage.setItem('la_auth', JSON.stringify(demoUser));
    setToast({ type: 'success', msg: 'Welcome to the Authority Economy!' });
  };

  const handleAddSite = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!currentUser) return;
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const domain = formData.get('domain') as string;

    const analysis = await analyzeDomain(domain);
    
    const newSite: Website = {
      id: `w${Date.now()}`,
      ownerId: currentUser.id,
      domain,
      domainAuthority: analysis.da,
      category: analysis.niche,
      description: analysis.summary
    };

    db.addWebsite(newSite);
    refresh();
    setLoading(false);
    setActiveTab('dashboard');
    setToast({ type: 'success', msg: `Site registered with DA ${analysis.da}` });
  };

  const handleExchange = async (recipientSite: Website) => {
    if (!currentUser) return;
    const providerSites = websites.filter(w => w.ownerId === currentUser.id);
    
    if (providerSites.length === 0) {
      setToast({ type: 'error', msg: 'Register a site first to provide links!' });
      return;
    }

    setLoading(true);
    const sourceSite = providerSites[0]; // For demo, use their first site
    const sourceUrl = `https://${sourceSite.domain}/verified-outreach`;
    
    const result = await verifyBacklink(sourceUrl, recipientSite.domain);
    
    if (result.success) {
      const tx: Transaction = {
        id: `tx${Date.now()}`,
        sourceWebsiteId: sourceSite.id,
        targetWebsiteId: recipientSite.id,
        recipientUserId: recipientSite.ownerId,
        providerUserId: currentUser.id,
        sourceUrl,
        pointsTransferred: sourceSite.domainAuthority,
        status: 'pending',
        timestamp: new Date()
      };

      executeExchange(currentUser.id, recipientSite.ownerId, sourceSite.domainAuthority, tx);
      setToast({ type: 'success', msg: `Link verified! Earned ${sourceSite.domainAuthority} points.` });
    } else {
      setToast({ type: 'error', msg: result.error || 'Verification failed.' });
    }
    
    refresh();
    setLoading(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e1b4b,transparent)] opacity-40"></div>
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <TrendingUp className="text-white" size={28} />
              </div>
              <span className="text-3xl font-black tracking-tight">LinkAuthority</span>
            </div>
            <h1 className="text-6xl font-black leading-tight">
              Trade <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Authority</span>,<br /> Not Just Links.
            </h1>
            <p className="text-slate-400 text-lg max-w-md">
              The first backlink exchange where Domain Authority translates directly into trading power. Verified dofollow links for serious SEOs.
            </p>
            <div className="flex gap-8">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ShieldCheck className="text-indigo-400" /> AI Verified
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Zap className="text-indigo-400" /> Real-time DA
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-[40px] backdrop-blur-xl text-center space-y-8">
            <h2 className="text-2xl font-bold">Start Building Power</h2>
            <button 
              onClick={handleDemoLogin}
              className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all font-black text-xl flex items-center justify-center gap-3 group"
            >
              Sign In to Marketplace
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="text-slate-500 text-sm">Join 2,400+ high-authority publishers</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#fcfdff]">
      {/* Sidebar */}
      <nav className="w-full lg:w-72 bg-[#0c1024] p-8 flex flex-col gap-10 text-white shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-indigo-400" size={28} />
          <span className="text-2xl font-black tracking-tight">LinkAuthority</span>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <button 
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${activeTab === 'marketplace' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Globe size={20} /> Marketplace
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <LayoutDashboard size={20} /> My Portfolio
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <History size={20} /> Activity
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className="mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-all font-bold"
          >
            <PlusCircle size={20} /> Register Website
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white/5 rounded-[24px] border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
              <Zap size={60} className="text-amber-400" />
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Trading Power</p>
            <p className="text-3xl font-black">{currentUser.points} <span className="text-sm font-medium text-slate-500">pts</span></p>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer">
            <img src={currentUser.avatar} className="w-10 h-10 rounded-xl" alt="profile" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">Pro Publisher</p>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-2 text-slate-500 hover:text-white"><LogOut size={18} /></button>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">
              {activeTab === 'marketplace' && 'Link Marketplace'}
              {activeTab === 'dashboard' && 'Publisher Portfolio'}
              {activeTab === 'history' && 'Activity Ledger'}
              {activeTab === 'add' && 'Site Registration'}
            </h2>
            <p className="text-slate-500 mt-1 font-medium italic">
              {activeTab === 'marketplace' && 'Authority score determines link value.'}
              {activeTab === 'dashboard' && 'Manage your high-DA assets.'}
            </p>
          </div>
          
          {activeTab === 'marketplace' && (
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <Search className="text-slate-400" size={18} />
              <input type="text" placeholder="Search by niche..." className="bg-transparent outline-none text-sm font-medium w-48" />
            </div>
          )}
        </header>

        {toast && (
          <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500' : 'bg-rose-50 text-rose-800 border-l-4 border-rose-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold">{toast.msg}</span>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {websites
              .filter(w => w.ownerId !== currentUser.id)
              // Only show sites if owner has > 0 points
              .filter(w => {
                const owner = db.getUsers().find(u => u.id === w.ownerId);
                return (owner?.points || 0) > 0;
              })
              .map(site => (
              <div key={site.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <Globe size={32} />
                  </div>
                  <div className="text-right">
                    <div className="da-badge text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                      DA {site.domainAuthority}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-tighter">SEO Authority</p>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{site.domain}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4 block">{site.category}</span>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">"{site.description}"</p>
                
                <div className="pt-6 border-t border-slate-50">
                  <button 
                    onClick={() => handleExchange(site)}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Request Backlink
                        <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Globe size={32} /></div>
                <div>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-wider">Active Domains</p>
                  <p className="text-3xl font-black">{websites.filter(w => w.ownerId === currentUser.id).length}</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Zap size={32} /></div>
                <div>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-wider">Trading Power</p>
                  <p className="text-3xl font-black">{currentUser.points}</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><ShieldCheck size={32} /></div>
                <div>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-wider">Verified Links</p>
                  <p className="text-3xl font-black">{transactions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-400">Website Asset</th>
                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-400">DA Score</th>
                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-400">Category</th>
                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-400 text-right">Visibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {websites.filter(w => w.ownerId === currentUser.id).map(site => (
                    <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-900">{site.domain}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm">DA {site.domainAuthority}</span>
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-medium">{site.category}</td>
                      <td className="px-8 py-6 text-right">
                        {currentUser.points > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-500 text-xs font-black uppercase"><AlertCircle size={14} /> Low Balance Hidden</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {websites.filter(w => w.ownerId === currentUser.id).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No websites registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto py-12">
            <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-slate-100 relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 animate-float">
                <Database size={40} />
              </div>
              <div className="text-center mb-10 mt-6">
                <h3 className="text-3xl font-black text-slate-900">Register New Asset</h3>
                <p className="text-slate-500 font-medium">Our AI will analyze your domain authority.</p>
              </div>
              <form onSubmit={handleAddSite} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Root Domain</label>
                  <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      name="domain" 
                      required 
                      placeholder="e.g. techblog.com" 
                      className="w-full bg-slate-50 border-2 border-slate-100 px-16 py-5 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold text-slate-900" 
                    />
                  </div>
                </div>
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                  <div className="flex gap-4 items-start">
                    <Zap className="text-indigo-600 shrink-0" size={24} />
                    <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                      By registering, your site will be scanned for Domain Authority. High DA sites (50+) earn significantly more points per verified link provided.
                    </p>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black text-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Run AI SEO Analysis'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 font-black uppercase text-slate-400 text-[10px] tracking-widest">
                <tr>
                  <th className="px-8 py-6">Timestamp</th>
                  <th className="px-8 py-6">Operation</th>
                  <th className="px-8 py-6">Host / Target</th>
                  <th className="px-8 py-6 text-right">Points Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map(tx => {
                  const isProvider = tx.providerUserId === currentUser.id;
                  const hostSite = websites.find(w => w.id === tx.sourceWebsiteId);
                  const targetSite = websites.find(w => w.id === tx.targetWebsiteId);
                  
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 text-slate-400 font-medium">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${isProvider ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {isProvider ? 'Provided Link' : 'Received Link'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{hostSite?.domain}</span>
                          <ChevronRight size={14} className="text-slate-300" />
                          <span className="font-medium text-slate-500">{targetSite?.domain}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-lg">
                        <span className={isProvider ? 'text-emerald-500' : 'text-rose-500'}>
                          {isProvider ? '+' : '-'}{tx.pointsTransferred}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No transactions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;