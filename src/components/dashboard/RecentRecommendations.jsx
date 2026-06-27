import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, TrendingUp, Mail, Calendar, FileText } from 'lucide-react';

const actionIcons = {
  'Follow Up': Mail,
  'Send Proposal': FileText,
  'Schedule Demo': Calendar,
  'Escalate': AlertTriangle,
  'Upsell': TrendingUp,
  'Address Risk': AlertTriangle,
  'Share Content': FileText,
  'Request Meeting': Calendar,
  'Custom': FileText,
};

const priorityColors = {
  'Critical': 'bg-red-100 text-red-700',
  'High': 'bg-orange-100 text-orange-700',
  'Medium': 'bg-blue-100 text-blue-700',
  'Low': 'bg-gray-100 text-gray-600',
};

export default function RecentRecommendations({ recommendations, customers }) {
  const customerMap = {};
  customers.forEach(c => { customerMap[c.id] = c.company_name; });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Pending Recommendations</h3>
        <Link to="/recommendations" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {recommendations.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No pending recommendations</p>
      ) : (
        <div className="space-y-3">
          {recommendations.slice(0, 5).map(rec => {
            const Icon = actionIcons[rec.action_type] || FileText;
            return (
              <Link key={rec.id} to={`/recommendations/${rec.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-violet-700">{rec.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{customerMap[rec.customer_id] || 'Unknown'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[rec.priority] || priorityColors['Medium']}`}>
                    {rec.priority}
                  </span>
                  {rec.confidence && (
                    <span className="text-xs text-gray-400">{rec.confidence}%</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}