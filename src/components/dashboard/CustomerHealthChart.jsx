import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CustomerHealthChart({ customers }) {
  const stageOrder = ['Prospect', 'Qualification', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Onboarding', 'Active', 'At Risk', 'Churned'];
  
  const stageCounts = stageOrder.map(stage => ({
    stage: stage.length > 10 ? stage.slice(0, 8) + '…' : stage,
    fullStage: stage,
    count: customers.filter(c => c.journey_stage === stage).length,
  })).filter(s => s.count > 0);

  const colors = {
    'Prospect': '#8b5cf6',
    'Qualification': '#7c3aed',
    'Demo': '#6366f1',
    'Proposal': '#3b82f6',
    'Negotiation': '#0ea5e9',
    'Closed Won': '#10b981',
    'Onboarding': '#14b8a6',
    'Active': '#22c55e',
    'At Risk': '#f59e0b',
    'Churned': '#ef4444',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Pipeline Distribution</h3>
      {stageCounts.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No customer data</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stageCounts}>
            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip 
              formatter={(value) => [value, 'Customers']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullStage || label}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {stageCounts.map((entry, i) => (
                <Cell key={i} fill={colors[entry.fullStage] || '#8b5cf6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}