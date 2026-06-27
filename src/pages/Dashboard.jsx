import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/Client';
import { Users, Lightbulb, AlertTriangle, TrendingUp, DollarSign, Activity } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentRecommendations from '@/components/dashboard/RecentRecommendations';
import CustomerHealthChart from '@/components/dashboard/CustomerHealthChart';

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [custs, recs, ints] = await Promise.all([
          base44.entities.Customer.list('-created_date', 100),
          base44.entities.Recommendation.filter({ status: 'Pending Review' }, '-created_date', 50),
          base44.entities.Interaction.list('-created_date', 50),
        ]);
        setCustomers(custs);
        setRecommendations(recs);
        setInteractions(ints);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const totalArr = customers.reduce((s, c) => s + (c.arr || 0), 0);
  const atRisk = customers.filter(c => c.journey_stage === 'At Risk').length;
  const avgHealth = customers.length ? Math.round(customers.reduce((s, c) => s + (c.health_score || 0), 0) / customers.length) : 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Intelligent Next Best Action Platform — SaaS Sales</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total Customers" value={customers.length} color="violet" />
        <MetricCard icon={Lightbulb} label="Pending Actions" value={recommendations.length} color="amber" />
        <MetricCard icon={AlertTriangle} label="At Risk" value={atRisk} color="rose" />
        <MetricCard icon={Activity} label="Avg Health Score" value={`${avgHealth}%`} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerHealthChart customers={customers} />
        <RecentRecommendations recommendations={recommendations} customers={customers} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Interactions</h3>
        {interactions.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No interactions yet</p>
        ) : (
          <div className="space-y-2">
            {interactions.slice(0, 6).map(int => (
              <div key={int.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                  backgroundColor: int.sentiment === 'Positive' ? '#22c55e' : int.sentiment === 'Negative' ? '#ef4444' : int.sentiment === 'Mixed' ? '#f59e0b' : '#9ca3af'
                }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{int.title}</p>
                  <p className="text-xs text-gray-500">{int.type} • {new Date(int.interaction_date || int.created_date).toLocaleDateString()}</p>
                </div>
                {int.sentiment && (
                  <span className="text-xs text-gray-400">{int.sentiment}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}