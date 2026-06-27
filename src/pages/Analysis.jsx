import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Play, CheckCircle, XCircle, Clock, Loader2, TrendingUp, AlertTriangle, HelpCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

export default function Analysis() {
  const [customers, setCustomers] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [custs, analysisRuns] = await Promise.all([
        base44.entities.Customer.list('-created_date', 200),
        base44.entities.AnalysisRun.list('-created_date', 20),
      ]);
      setCustomers(custs);
      setRuns(analysisRuns);
      setLoading(false);
    }
    load();
  }, []);

  const customerMap = {};
  customers.forEach(c => { customerMap[c.id] = c; });

  const runAnalysis = async () => {
    if (!selectedCustomer) return;
    setAnalyzing(true);
    const startTime = Date.now();
    const customer = customerMap[selectedCustomer];

    let runId;
    try {
      const run = await base44.entities.AnalysisRun.create({
        customer_id: selectedCustomer,
        status: 'Running',
        current_step: 'Gathering interactions',
        steps_completed: [],
      });
      runId = run.id;

      setCurrentStep('Step 1: Gathering customer interactions...');
      const interactions = await base44.entities.Interaction.filter({ customer_id: selectedCustomer }, '-created_date', 50);
      await base44.entities.AnalysisRun.update(runId, { steps_completed: ['Gather Interactions'], current_step: 'Retrieving knowledge' });

      setCurrentStep('Step 2: Retrieving relevant knowledge...');
      const knowledge = await base44.entities.KnowledgeArticle.filter({ status: 'Published' }, '-effectiveness_score', 20);
      await base44.entities.AnalysisRun.update(runId, { steps_completed: ['Gather Interactions', 'Retrieve Knowledge'], current_step: 'Checking memory' });

      setCurrentStep('Step 3: Checking agent memory...');
      const memories = await base44.entities.AgentMemory.filter({ customer_id: selectedCustomer }, '-created_date', 20);
      await base44.entities.AnalysisRun.update(runId, { steps_completed: ['Gather Interactions', 'Retrieve Knowledge', 'Check Memory'], current_step: 'Analyzing context' });

      setCurrentStep('Step 4: Analyzing business context with AI...');
      const interactionsSummary = interactions.map(i => `[${i.type}] ${i.title}: ${i.summary || i.content?.substring(0, 200)}`).join('\n');
      const knowledgeSummary = knowledge.map(k => `[${k.category}] ${k.title}: ${k.content?.substring(0, 150)}`).join('\n');
      const memorySummary = memories.map(m => `[${m.memory_type}] ${m.content}`).join('\n');

      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Sales Intelligence Analyst. Analyze this SaaS customer and generate next best action recommendations.

CUSTOMER PROFILE:
Company: ${customer.company_name}
Industry: ${customer.industry || 'Unknown'}
Journey Stage: ${customer.journey_stage}
Health Score: ${customer.health_score || 50}/100
ARR: $${customer.arr || 0}
Contact: ${customer.contact_name || 'Unknown'} (${customer.contact_role || 'Unknown role'})

RECENT INTERACTIONS:
${interactionsSummary || 'No recent interactions recorded.'}

RELEVANT KNOWLEDGE BASE:
${knowledgeSummary || 'No knowledge articles available.'}

PREVIOUS RECOMMENDATION OUTCOMES (MEMORY):
${memorySummary || 'No previous recommendation history.'}

Based on this analysis, provide:
1. Key opportunities identified
2. Risks and concerns
3. Missing information that would help
4. 2-4 specific, actionable next best action recommendations

For each recommendation, include:
- A clear title
- Detailed description
- Action type (one of: Follow Up, Send Proposal, Schedule Demo, Escalate, Upsell, Address Risk, Share Content, Request Meeting)
- Priority (Critical, High, Medium, or Low)
- Confidence score (0-100)
- Detailed reasoning
- Supporting evidence
- Impact score (0-100)
- Suggested due date (within next 1-14 days from today ${new Date().toISOString().split('T')[0]})`,
        response_json_schema: {
          type: 'object',
          properties: {
            opportunities: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } },
            missing_info: { type: 'array', items: { type: 'string' } },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  action_type: { type: 'string' },
                  priority: { type: 'string' },
                  confidence: { type: 'number' },
                  reasoning: { type: 'string' },
                  evidence: { type: 'array', items: { type: 'string' } },
                  impact_score: { type: 'number' },
                  due_date: { type: 'string' },
                },
              },
            },
            summary: { type: 'string' },
          },
        },
        model: 'claude_sonnet_4_6',
      });

      setCurrentStep('Step 5: Generating recommendations...');
      let recsCreated = 0;
      if (analysisResult.recommendations) {
        for (const rec of analysisResult.recommendations) {
          await base44.entities.Recommendation.create({
            customer_id: selectedCustomer,
            title: rec.title,
            description: rec.description,
            action_type: rec.action_type || 'Follow Up',
            priority: rec.priority || 'Medium',
            confidence: rec.confidence || 50,
            reasoning: rec.reasoning,
            evidence: rec.evidence || [],
            impact_score: rec.impact_score || 50,
            due_date: rec.due_date,
            status: 'Pending Review',
          });
          recsCreated++;
        }
      }

      const duration = Math.round((Date.now() - startTime) / 1000);
      await base44.entities.AnalysisRun.update(runId, {
        status: 'Completed',
        steps_completed: ['Gather Interactions', 'Retrieve Knowledge', 'Check Memory', 'Analyze Context', 'Generate Recommendations'],
        current_step: 'Complete',
        results_summary: analysisResult.summary || 'Analysis complete',
        opportunities: analysisResult.opportunities || [],
        risks: analysisResult.risks || [],
        missing_info: analysisResult.missing_info || [],
        recommendations_generated: recsCreated,
        duration_seconds: duration,
      });

      const updatedRuns = await base44.entities.AnalysisRun.list('-created_date', 20);
      setRuns(updatedRuns);
      toast({ title: 'Analysis complete', description: `${recsCreated} recommendations generated in ${duration}s` });
    } catch (e) {
      if (runId) {
        await base44.entities.AnalysisRun.update(runId, { status: 'Failed', error_message: e.message });
      }
      toast({ title: 'Analysis failed', description: e.message, variant: 'destructive' });
    }

    setAnalyzing(false);
    setCurrentStep('');
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Analysis</h1>
        <p className="text-sm text-gray-500 mt-0.5">Run the Planner Agent to analyze customers and generate recommendations</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-600" /> Run Analysis
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Select a customer to analyze" /></SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.company_name} — {c.journey_stage} ({c.health_score || 0}% health)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={runAnalysis}
            disabled={!selectedCustomer || analyzing}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Play className="w-4 h-4 mr-2" />Run Analysis</>}
          </Button>
        </div>
        {analyzing && currentStep && (
          <div className="mt-4 p-4 bg-violet-50 rounded-lg border border-violet-100">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
              <p className="text-sm text-violet-700 font-medium">{currentStep}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Recent Analysis Runs</h3>
        {runs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            <Brain className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No analysis runs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map(run => {
              const cust = customerMap[run.customer_id];
              return (
                <div key={run.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {run.status === 'Completed' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                         run.status === 'Failed' ? <XCircle className="w-4 h-4 text-red-500" /> :
                         <Clock className="w-4 h-4 text-amber-500" />}
                        <span className="font-medium text-gray-900">{cust?.company_name || 'Unknown'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          run.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          run.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{run.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(run.created_date).toLocaleString()}
                        {run.duration_seconds && ` • ${run.duration_seconds}s`}
                        {run.recommendations_generated > 0 && ` • ${run.recommendations_generated} recommendations`}
                      </p>
                    </div>
                    {run.status === 'Completed' && cust && (
                      <Link to={`/customers/${cust.id}`} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {run.results_summary && (
                    <p className="text-sm text-gray-600 mt-3">{run.results_summary}</p>
                  )}

                  {run.status === 'Completed' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                      {run.opportunities?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3" /> Opportunities
                          </p>
                          <ul className="space-y-1">{run.opportunities.map((o, i) => <li key={i} className="text-xs text-gray-600">• {o}</li>)}</ul>
                        </div>
                      )}
                      {run.risks?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3 h-3" /> Risks
                          </p>
                          <ul className="space-y-1">{run.risks.map((r, i) => <li key={i} className="text-xs text-gray-600">• {r}</li>)}</ul>
                        </div>
                      )}
                      {run.missing_info?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
                            <HelpCircle className="w-3 h-3" /> Missing Info
                          </p>
                          <ul className="space-y-1">{run.missing_info.map((m, i) => <li key={i} className="text-xs text-gray-600">• {m}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}

                  {run.error_message && (
                    <p className="text-xs text-red-600 mt-2">{run.error_message}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}