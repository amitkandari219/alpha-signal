/**
 * Alerts Feed Component
 *
 * Displays recent alert triggers
 */

import React from 'react';
import { Bell, TrendingUp, DollarSign, FileText, Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { Alert } from '../../data/mockDashboardData';

interface AlertsFeedProps {
  alerts: Alert[];
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts }) => {
  const getAlertIcon = (type: Alert['type']) => {
    const iconClass = 'w-4 h-4';
    switch (type) {
      case 'price':
        return <DollarSign className={iconClass} />;
      case 'technical':
        return <TrendingUp className={iconClass} />;
      case 'fundamental':
        return <FileText className={iconClass} />;
      case 'news':
        return <FileText className={iconClass} />;
      case 'risk':
        return <Shield className={iconClass} />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'price':
        return 'text-signal-blue';
      case 'technical':
        return 'text-signal-green';
      case 'fundamental':
        return 'text-[#A371F7]';
      case 'news':
        return 'text-signal-yellow';
      case 'risk':
        return 'text-signal-red';
    }
  };

  return (
    <CollapsiblePanel
      title="Alerts"
      icon={Bell}
      defaultExpanded={true}
      headerRight={
        <Link
          to="/alerts"
          className="text-xs text-signal-blue hover:underline flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          View all
          <ExternalLink className="w-3 h-3" />
        </Link>
      }
    >
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-bg-tertiary rounded-lg p-4 hover:bg-bg-tertiary/80 transition-colors ${
              alert.isUnread ? 'border-l-4 border-l-signal-blue' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${getAlertColor(alert.type)}`}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/stock/${alert.symbol}`}
                    className="font-medium text-text-primary hover:text-signal-blue text-sm"
                  >
                    {alert.symbol}
                  </Link>
                  <span className="text-xs text-text-muted">{alert.timestamp}</span>
                  {alert.isUnread && (
                    <span className="w-2 h-2 rounded-full bg-signal-blue"></span>
                  )}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{alert.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
};
