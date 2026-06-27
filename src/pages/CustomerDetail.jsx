import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Mail, Phone, Building2, TrendingUp, AlertTriangle, Lightbulb, MessageSquare, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const stages = ['Prospect', 'Qualification', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Onboarding', 'Active', 'At Risk', 'Churned'];

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [cust, ints, recs] = await Promise.all([
          base44.entities.Customer.get(id),
          base44.entities.Interaction.filter({ customer_id: id }, '-created_date', 50),
          base44.entities.Recommendation.filter({ customer_id: id }, '-created_date', 20),
        ]);
        setCustomer(cust);
        setEditForm(cust);
        setInteractions(ints);
        setRecommendations(recs);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSave = async () => {
    const { id: _, created_date, updated_date, created_by_id, ...data } = editForm;
    await base44.entities.Customer.update(id, data);
    setCustomer({ ...customer, ...data });
    setEditing(false);
    toast({ title: 'Customer updated' });
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>;
  if (!customer) return <div className="flex items-center justify-center h-full text-gray-400">Customer not found</div>;

  const healthColor = (customer.health_score || 0) >= 70 ? 'text-emerald-600' : (customer.health_score || 0) >= 40 ? 'text-amber-600' : 'text-red-600';
  const pendingRecs = recommendations.filter(r => r.status === 'Pending Review');

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            {editing ? (
              <Input className="text-xl font-bold mb-2" value={editForm.company_name} onChange={e => setEditForm({...editForm, company_name: e.target.value})} />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{customer.company_name}</h1>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              {customer.industry && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{customer.industry}</span>}
              {customer.contact_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{customer.contact_email}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditForm(customer); }}><X className="w-4 h-4" /></Button>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={handleSave}><Save className="w-4 h-4 mr-1" />Save</Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4 mr-1" />Edit</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Stage</p>
            {editing ? (
              <Select value={editForm.journey_stage} onValueChange={v => setEditForm({...editForm, journey_stage: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-semibold mt-1">{customer.journey_stage}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Health</p>
            {editing ? (
              <Input type="number" className="mt-1" value={editForm.health_score} onChange={e => setEditForm({...editForm, health_score: Number(e.target.value)})} />
            ) : (
              <p className={`text-sm font-semibold mt-1 ${healthColor}`}>{customer.health_score || 0}%</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">ARR</p>
            {editing ? (
              <Input type="number" className="mt-1" value={editForm.arr} onChange={e => setEditForm({...editForm, arr: Number(e.target.value)})} />
            ) : (
              <p className="text-sm font-semibold mt-1">${(customer.arr || 0).toLocaleString()}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Contact</p>
            <p className="text-sm font-semibold mt-1">{customer.contact_name || '—'}</p>
          </div>
        </div>

        {editing && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes</p>
            <Textarea value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={3} />
          </div>
        )}
        {!editing && customer.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-600">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-violet-500" />Interactions</h3>
            <span className="text-xs text-gray-400">{interactions.length} total</span>
          </div>
          {interactions.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No interactions recorded</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {interactions.map(int => (
                <div key={int.id} className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{int.title}</p>
                    <span className="text-xs text-gray-400">{int.type}</span>
                  </div>
                  {int.summary && <p className="text-xs text-gray-500 mt-1">{int.summary}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(int.interaction_date || int.created_date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" />Recommendations</h3>
            {pendingRecs.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{pendingRecs.length} pending</span>
            )}
          </div>
          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No recommendations yet</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recommendations.map(rec => (
                <Link key={rec.id} to={`/recommendations/${rec.id}`} className="block p-3 rounded-lg bg-gray-50 hover:bg-violet-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      rec.status === 'Pending Review' ? 'bg-amber-100 text-amber-700' :
                      rec.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                      rec.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      rec.status === 'Executed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{rec.status}</span>
                  </div>
                  {rec.confidence && <p className="text-xs text-gray-400 mt-1">Confidence: {rec.confidence}%</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}