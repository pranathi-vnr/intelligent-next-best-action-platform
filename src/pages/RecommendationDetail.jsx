import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, CheckCircle, XCircle, Play, Clock, AlertTriangle, FileText, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export default function RecommendationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rec, setRec] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const recommendation = await base44.entities.Recommendation.get(id);
        setRec(recommendation);
        setReviewNotes(recommendation.review_notes || '');
        if (recommendation.customer_id) {
          const cust = await base44.entities.Customer.get(recommendation.customer_id);
          setCustomer(cust);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleAction = async (status) => {
    setUpdating(true);
    try {
      const updateData = {
        status,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
      };
      if (status === 'Executed') {
        updateData.executed_at = new Date().toISOString();
      }

      await base44.entities.Recommendation.update(id, updateData);

      await base44.entities.AgentMemory.create({
        memory_type: 'Recommendation Outcome',
        customer_id: rec.customer_id,
        content: `Recommendation "${rec.title}" (${rec.action_type}) was ${status.toLowerCase()}. ${reviewNotes ? `Review notes: ${reviewNotes}` : ''}`,
        metadata: {
          recommendation_id: id,
          action_type: rec.action_type,
          priority: rec.priority,
          confidence: rec.confidence,
          outcome: status,
        },
        relevance_score: 80,
        source: 'human_review',
      });

      setRec({ ...rec, ...updateData });
      toast({ title: `Recommendation ${status.toLowerCase()}` });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setUpdating(false);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>;
  if (!rec) return <div className="flex items-center justify-center h-full text-gray-400">Recommendation not found</div>;

  const isPending = rec.status === 'Pending Review';
  const isAccepted = rec.status === 'Accepted';

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <Link to="/recommendations" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Recommendations
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                rec.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                rec.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                rec.priority === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>{rec.priority} Priority</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">{rec.action_type}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                rec.status === 'Pending Review' ? 'bg-amber-100 text-amber-700' :
                rec.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                rec.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                rec.status === 'Executed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>{rec.status}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-3">{rec.title}</h1>
            {customer && (
              <Link to={`/customers/${customer.id}`} className="text-sm text-violet-600 hover:text-violet-700 mt-1 inline-block">
                {customer.company_name}
              </Link>
            )}
          </div>
          {rec.confidence != null && (
            <div className="text-center flex-shrink-0">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={rec.confidence >= 70 ? '#22c55e' : rec.confidence >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="2.5" strokeDasharray={`${rec.confidence}, 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">{rec.confidence}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Confidence</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{rec.description}</p>
          </div>

          {rec.reasoning && (
            <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
              <h3 className="text-sm font-semibold text-violet-900 mb-1.5 flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> AI Reasoning
              </h3>
              <p className="text-sm text-violet-800 leading-relaxed">{rec.reasoning}</p>
            </div>
          )}

          {rec.evidence?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-400" /> Supporting Evidence
              </h3>
              <ul className="space-y-2">
                {rec.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            {rec.impact_score != null && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Impact</p>
                <p className="text-sm font-semibold mt-0.5">{rec.impact_score}/100</p>
              </div>
            )}
            {rec.due_date && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Due Date</p>
                <p className="text-sm font-semibold mt-0.5">{new Date(rec.due_date).toLocaleDateString()}</p>
              </div>
            )}
            {rec.reviewed_at && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Reviewed</p>
                <p className="text-sm font-semibold mt-0.5">{new Date(rec.reviewed_at).toLocaleDateString()}</p>
              </div>
            )}
            {rec.executed_at && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Executed</p>
                <p className="text-sm font-semibold mt-0.5">{new Date(rec.executed_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(isPending || isAccepted) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Human-in-the-Loop Review</h3>
          <Textarea
            placeholder="Add review notes (optional)..."
            rows={3}
            value={reviewNotes}
            onChange={e => setReviewNotes(e.target.value)}
            className="mb-4"
          />
          <div className="flex flex-wrap gap-3">
            {isPending && (
              <>
                <Button onClick={() => handleAction('Accepted')} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="w-4 h-4 mr-2" /> Accept
                </Button>
                <Button onClick={() => handleAction('Rejected')} disabled={updating} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </>
            )}
            {isAccepted && (
              <Button onClick={() => handleAction('Executed')} disabled={updating} className="bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" /> Mark as Executed
              </Button>
            )}
          </div>
        </div>
      )}

      {rec.review_notes && !isPending && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Review Notes</h3>
          <p className="text-sm text-gray-600">{rec.review_notes}</p>
        </div>
      )}
    </div>
  );
}