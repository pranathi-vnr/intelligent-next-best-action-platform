import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Lightbulb, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const priorityColors = {
  'Critical': 'bg-red-100 text-red-700 border-red-200',
  'High': 'bg-orange-100 text-orange-700 border-orange-200',
  'Medium': 'bg-blue-100 text-blue-700 border-blue-200',
  'Low': 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusColors = {
  'Pending Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Accepted': 'bg-green-50 text-green-700 border-green-200',
  'Rejected': 'bg-red-50 text-red-700 border-red-200',
  'Executed': 'bg-blue-50 text-blue-700 border-blue-200',
  'Expired': 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function load() {
      const [recs, custs] = await Promise.all([
        base44.entities.Recommendation.list('-created_date', 200),
        base44.entities.Customer.list('-created_date', 200),
      ]);
      setRecommendations(recs);
      setCustomers(custs);
      setLoading(false);
    }
    load();
  }, []);

  const customerMap = {};
  customers.forEach(c => { customerMap[c.id] = c.company_name; });

  const filtered = recommendations.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      (customerMap[r.customer_id] || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    all: recommendations.length,
    'Pending Review': recommendations.filter(r => r.status === 'Pending Review').length,
    'Accepted': recommendations.filter(r => r.status === 'Accepted').length,
    'Rejected': recommendations.filter(r => r.status === 'Rejected').length,
    'Executed': recommendations.filter(r => r.status === 'Executed').length,
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
        <p className="text-sm text-gray-500 mt-0.5">AI-generated next best actions for your customers</p>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="Pending Review">Pending ({statusCounts['Pending Review']})</TabsTrigger>
          <TabsTrigger value="Accepted">Accepted ({statusCounts['Accepted']})</TabsTrigger>
          <TabsTrigger value="Executed">Executed ({statusCounts['Executed']})</TabsTrigger>
          <TabsTrigger value="Rejected">Rejected ({statusCounts['Rejected']})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search recommendations..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No recommendations found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rec => (
            <Link key={rec.id} to={`/recommendations/${rec.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityColors[rec.priority] || ''}`}>{rec.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[rec.status] || ''}`}>{rec.status}</span>
                    <span className="text-xs text-gray-400">{rec.action_type}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-2 group-hover:text-violet-700 transition-colors">{rec.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{rec.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {customerMap[rec.customer_id] || 'Unknown Customer'}
                    {rec.due_date && ` • Due ${new Date(rec.due_date).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {rec.confidence != null && (
                    <div className="text-center">
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={rec.confidence >= 70 ? '#22c55e' : rec.confidence >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${rec.confidence}, 100`} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{rec.confidence}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}