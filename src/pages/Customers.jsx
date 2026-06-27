import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const stages = ['Prospect', 'Qualification', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Onboarding', 'Active', 'At Risk', 'Churned'];
const industries = ['SaaS', 'FinTech', 'HealthTech', 'E-Commerce', 'EdTech', 'MarTech', 'HRTech', 'Other'];

const stageColors = {
  'Prospect': 'bg-violet-100 text-violet-700',
  'Qualification': 'bg-purple-100 text-purple-700',
  'Demo': 'bg-indigo-100 text-indigo-700',
  'Proposal': 'bg-blue-100 text-blue-700',
  'Negotiation': 'bg-sky-100 text-sky-700',
  'Closed Won': 'bg-emerald-100 text-emerald-700',
  'Onboarding': 'bg-teal-100 text-teal-700',
  'Active': 'bg-green-100 text-green-700',
  'At Risk': 'bg-amber-100 text-amber-700',
  'Churned': 'bg-red-100 text-red-700',
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ company_name: '', industry: 'SaaS', contact_name: '', contact_email: '', journey_stage: 'Prospect', health_score: 50, arr: 0 });
  const { toast } = useToast();

  const loadCustomers = async () => {
    const data = await base44.entities.Customer.list('-created_date', 200);
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleCreate = async () => {
    await base44.entities.Customer.create(form);
    toast({ title: 'Customer created' });
    setDialogOpen(false);
    setForm({ company_name: '', industry: 'SaaS', contact_name: '', contact_email: '', journey_stage: 'Prospect', health_score: 50, arr: 0 });
    loadCustomers();
  };

  const filtered = customers.filter(c => {
    const matchSearch = c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === 'all' || c.journey_stage === filterStage;
    return matchSearch && matchStage;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} total customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Company Name *" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} />
              <Select value={form.industry} onValueChange={v => setForm({...form, industry: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Contact Name" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} />
              <Input placeholder="Contact Email" type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} />
              <Select value={form.journey_stage} onValueChange={v => setForm({...form, journey_stage: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Health Score" type="number" value={form.health_score} onChange={e => setForm({...form, health_score: Number(e.target.value)})} />
                <Input placeholder="ARR ($)" type="number" value={form.arr} onChange={e => setForm({...form, arr: Number(e.target.value)})} />
              </div>
              <Button onClick={handleCreate} disabled={!form.company_name} className="w-full bg-violet-600 hover:bg-violet-700">Create Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search customers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No customers found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Link key={c.id} to={`/customers/${c.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-700 transition-colors">{c.company_name}</h3>
                  {c.contact_name && <p className="text-sm text-gray-500 mt-0.5">{c.contact_name}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColors[c.journey_stage] || 'bg-gray-100 text-gray-600'}`}>
                  {c.journey_stage}
                </span>
                {c.industry && <span className="text-xs text-gray-400">{c.industry}</span>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${c.health_score || 0}%`,
                      backgroundColor: (c.health_score || 0) >= 70 ? '#22c55e' : (c.health_score || 0) >= 40 ? '#f59e0b' : '#ef4444'
                    }} />
                  </div>
                  <span className="text-xs text-gray-400">{c.health_score || 0}%</span>
                </div>
                {c.arr > 0 && <span className="text-xs font-medium text-gray-600">${(c.arr / 1000).toFixed(0)}k ARR</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}