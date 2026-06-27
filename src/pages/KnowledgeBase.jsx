import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/Client';
import { Plus, Search, BookOpen, FileText, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const categories = ['Playbook', 'Best Practice', 'Product Documentation', 'Case Study', 'Competitive Intel', 'Pricing Guide', 'Objection Handling', 'Industry Research'];
const stages = ['Prospect', 'Qualification', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Onboarding', 'Active', 'At Risk', 'Churned'];

const categoryColors = {
  'Playbook': 'bg-violet-100 text-violet-700',
  'Best Practice': 'bg-emerald-100 text-emerald-700',
  'Product Documentation': 'bg-blue-100 text-blue-700',
  'Case Study': 'bg-amber-100 text-amber-700',
  'Competitive Intel': 'bg-red-100 text-red-700',
  'Pricing Guide': 'bg-teal-100 text-teal-700',
  'Objection Handling': 'bg-orange-100 text-orange-700',
  'Industry Research': 'bg-indigo-100 text-indigo-700',
};

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewArticle, setViewArticle] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'Playbook', content: '', tags: '', applicable_stages: [], author: '' });
  const { toast } = useToast();

  const loadArticles = async () => {
    const data = await base44.entities.KnowledgeArticle.list('-created_date', 200);
    setArticles(data);
    setLoading(false);
  };

  useEffect(() => { loadArticles(); }, []);

  const handleCreate = async () => {
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await base44.entities.KnowledgeArticle.create({
      ...form,
      tags,
      status: 'Published',
    });
    toast({ title: 'Article created' });
    setDialogOpen(false);
    setForm({ title: '', category: 'Playbook', content: '', tags: '', applicable_stages: [], author: '' });
    loadArticles();
  };

  const filtered = articles.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.content?.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCat === 'all' || a.category === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-0.5">Playbooks, best practices, and enterprise knowledge</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4 mr-2" />Add Article</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Knowledge Article</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Article Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea placeholder="Article content..." rows={8} value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
              <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
              <Input placeholder="Author" value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
              <Button onClick={handleCreate} disabled={!form.title || !form.content} className="w-full bg-violet-600 hover:bg-violet-700">Create Article</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search articles..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(article => (
            <div key={article.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewArticle(article)}>
              <div className="flex items-start justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[article.category] || 'bg-gray-100 text-gray-600'}`}>
                  {article.category}
                </span>
                {article.effectiveness_score > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-current" /> {article.effectiveness_score}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-gray-900 mt-3">{article.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.content}</p>
              {article.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {article.tags.slice(0, 3).map((t, i) => (
                    <span key={i} className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              )}
              {article.author && <p className="text-xs text-gray-400 mt-3">By {article.author}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewArticle} onOpenChange={() => setViewArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[viewArticle.category] || ''}`}>
                    {viewArticle.category}
                  </span>
                  {viewArticle.status && <span className="text-xs text-gray-400">{viewArticle.status}</span>}
                </div>
                <DialogTitle>{viewArticle.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewArticle.content}</div>
              {viewArticle.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                  {viewArticle.tags.map((t, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}