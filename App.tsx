
import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  LayoutDashboard, 
  ArrowUpRight, 
  ShieldCheck, 
  PlusCircle,
  History,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { db } from './services/mockDatabase';
import { User, Website, Transaction } from './types';
import { analyzeWebsiteForDA } from './services/geminiService';
import { verifyBacklink, executeExchange } from './services/verificationService';

// --- Sub-components ---

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
  const [currentUser, setCurrentUser] = useState<User>(db.getUsers()[0]);
  const [websites, setWebsites] = useState<Website[]>(db.getWebsites());
  const [transactions, setTransactions] = useState<Transaction[]>(db.getTransactions());
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Sync state with mockDB
  const refreshData = () => {
    setWebsites(db.getWebsites());
    setTransactions(db.getTransactions());
    const refreshedUser = db.getUsers().find(u => u.id === currentUser.id);
    if (refreshedUser) setCurrentUser({ ...refreshedUser });
  };

  const handleAddWebsite = async (e: React.FormEvent<HTMLFormElement>) => {
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
    setIsLoading(true);
    
    // Simulate the user providing a "Source URL" where they supposedly put the link
    const simulatedSourceUrl = `https://${sourceWebsite.domain}/blog/guest-post-feature`;
    
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <TrendingUp className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">LinkAuthority</span>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'marketplace' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Globe size={20} /> Marketplace
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20} /> My Sites
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
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

        <div className="mt-auto p-4 bg-slate-900 rounded-2xl text-white">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs uppercase tracking-wider">Trading Power</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold">{currentUser.points} pts</div>
          <p className="text-[10px] text-slate-400 mt-1">1 pt = 1 unit of DA authority</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {activeTab === 'marketplace' && 'Link Marketplace'}
              {activeTab === 'dashboard' && 'Publisher Dashboard'}
              {activeTab === 'add-site' && 'Add Website'}
              {activeTab === 'history' && 'Transaction History'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'marketplace' && 'Trade authority with verified high-DA domains'}
              {activeTab === 'dashboard' && 'Manage your domains and view incoming requests'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <span className="font-medium text-slate-700">{currentUser.name}</span>
          </div>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform scale-100 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* View Switcher */}
        <div className="space-y-8">
          {activeTab === 'marketplace' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.filter(w => w.ownerId !== currentUser.id).map(site => (
                <div key={site.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
                  <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{site.category}</span>
                      <h3 className="text-xl font-bold text-slate-900 truncate">{site.domain}</h3>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold">DA</span>
                      <span className="text-lg font-black text-indigo-600">{site.domainAuthority}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-slate-600 text-sm mb-6 line-clamp-2 min-h-[40px]">{site.description}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const userSites = websites.filter(w => w.ownerId === currentUser.id);
                          if (userSites.length === 0) {
                            setNotification({ type: 'error', message: 'You must add a site first!' });
                            return;
                          }
                          handleVerifyExchange(userSites[0], site);
                        }}
                        disabled={isLoading}
                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Exchange Link'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Sites" value={websites.filter(w => w.ownerId === currentUser.id).length} icon={Globe} color="bg-blue-500" />
                <StatCard title="Earned Points" value={currentUser.points} icon={ArrowUpRight} color="bg-indigo-500" />
                <StatCard title="Total Exchanges" value={transactions.filter(t => t.providerUserId === currentUser.id || t.recipientUserId === currentUser.id).length} icon={ShieldCheck} color="bg-emerald-500" />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">Registered Domains</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                      <tr>
                        <th className="px-6 py-4">Domain</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Authority (DA)</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {websites.filter(w => w.ownerId === currentUser.id).map(site => (
                        <tr key={site.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4 font-semibold text-slate-900">{site.domain}</td>
                          <td className="px-6 py-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{site.category}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full" style={{ width: `${site.domainAuthority}%` }} />
                              </div>
                              <span className="font-bold">{site.domainAuthority}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-slate-600"><ExternalLink size={18} /></button>
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
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <form onSubmit={handleAddWebsite} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Domain URL</label>
                  <input 
                    name="domain"
                    required
                    placeholder="example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-xs text-slate-400 italic">We use AI analysis to verify current Domain Authority.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Site Description</label>
                  <textarea 
                    name="description"
                    rows={4}
                    placeholder="Tell other users why your site is valuable for their niche..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-indigo-100"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze & Register Site'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Exchange Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.filter(tx => tx.providerUserId === currentUser.id || tx.recipientUserId === currentUser.id).map(tx => {
                      const isProvider = tx.providerUserId === currentUser.id;
                      return (
                        <tr key={tx.id}>
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {isProvider ? (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black">EARNED</span>
                              ) : (
                                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black">SPENT</span>
                              )}
                              <span className="text-sm font-medium">
                                {isProvider ? `Backlink provided on site ${tx.sourceWebsiteId}` : `Backlink received on ${tx.targetWebsiteId}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{isProvider ? '+' : '-'}{tx.pointsTransferred} pts</td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                              <CheckCircle2 size={14} /> Verified
                            </span>
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

        {/* Info Banner */}
        {activeTab === 'marketplace' && currentUser.points < 1 && (
          <div className="mt-10 bg-rose-50 border border-rose-200 p-6 rounded-2xl flex items-center gap-6">
            <div className="bg-rose-600 p-3 rounded-xl text-white">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-900">Low Trading Power!</h3>
              <p className="text-rose-700">Your site is currently hidden from the marketplace because your points are below 1. Provide a backlink to another user to earn points and regain visibility.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
