import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/Client';
import { Plus, Search, FileText, Mail, Phone, MessageSquare, Headphones, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const types = ['Meeting Notes', 'Email', 'Call Transcript', 'CRM Update', 'Chat', 'Support Ticket'];
const typeIcons = {
  'Meeting Notes': FileText, 'Email': Mail, 'Call Transcript': Phone,
  'CRM Update': MessageSquare, 'Chat': MessageSquare, 'Support Ticket': Headphones,
};
const sentimentColors = {
  'Positive': 'bg-emerald-100 text-emerald-700',
  'Neutral': 'bg-gray-100 text-gray-600',
  'Negative': 'bg-red-100 text-red-700',
  'Mixed': 'bg-amber-100 text-amber-700',
};

export default function Interactions() {
  const [interactions, setInteractions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({ customer_id: '', type: 'Meeting Notes', title: '', content: '', interaction_date: new Date().toISOString().split('T')[0] });
  const { toast } = useToast();

  const loadData = async () => {
    const [ints, custs] = await Promise.all([
      base44.entities.Interaction.list('-created_date', 200),
      base44.entities.Customer.list('-created_date', 200),
    ]);
    setInteractions(ints);
    setCustomers(custs);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const customerMap = {};
  customers.forEach(c => { customerMap[c.id] = c.company_name; });

  const handleCreate = async () => {
    setProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this ${form.type} interaction and provide a JSON response:

Title: ${form.title}
Content: ${form.content}

Return:
- summary: 2-3 sentence summary
- sentiment: one of "Positive", "Neutral", "Negative", "Mixed"
- key_topics: array of 3-5 key topics discussed
- action_items: array of action items identified`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            sentiment: { type: 'string', enum: ['Positive', 'Neutral', 'Negative', 'Mixed'] },
            key_topics: { type: 'array', items: { type: 'string' } },
            action_items: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      await base44.entities.Interaction.create({
        ...form,
        summary: result.summary,
        sentiment: result.sentiment,
        key_topics: result.key_topics,
        action_items: result.action_items,
        interaction_date: new Date(form.interaction_date).toISOString(),
      });

      if (form.customer_id) {
        await base44.entities.Customer.update(form.customer_id, {
          last_interaction_date: new Date().toISOString(),
        });
      }

      toast({ title: 'Interaction saved', description: 'AI analysis complete' });
      setDialogOpen(false);
      setForm({ customer_id: '', type: 'Meeting Notes', title: '', content: '', interaction_date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setProcessing(false);
  };

  const filtered = interactions.filter(i => {
    const matchSearch = i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.content?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || i.type === filterType;
    return matchSearch && matchType;
  });

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ingest and manage customer interactions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4 mr-2" />Add Interaction</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Interaction</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Select value={form.customer_id || 'none'} onValueChange={v => setForm({...form, customer_id: v === 'none' ? '' : v})}>
                <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Customer</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <Textarea placeholder="Paste meeting notes, email content, transcript, or any interaction details..." rows={8} value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
              <Input type="date" value={form.interaction_date} onChange={e => setForm({...form, interaction_date: e.target.value})} />
              <Button onClick={handleCreate} disabled={!form.title || !form.content || processing} className="w-full bg-violet-600 hover:bg-violet-700">
                {processing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Analyzing...</> : 'Save & Analyze'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search interactions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No interactions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(int => {
            const Icon = typeIcons[int.type] || FileText;
            return (
              <div key={int.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{int.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-400">{int.type}</span>
                          {int.customer_id && <span className="text-xs text-violet-600">• {customerMap[int.customer_id] || 'Unknown'}</span>}
                          <span className="text-xs text-gray-400">• {new Date(int.interaction_date || int.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {int.sentiment && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sentimentColors[int.sentiment] || ''}`}>
                          {int.sentiment}
                        </span>
                      )}
                    </div>
                    {int.summary && <p className="text-sm text-gray-600 mt-2">{int.summary}</p>}
                    {int.key_topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {int.key_topics.map((t, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                    {int.action_items?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-medium mb-1">Action Items</p>
                        <ul className="space-y-1">
                          {int.action_items.map((a, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}