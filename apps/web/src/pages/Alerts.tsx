/**
 * Alerts Page
 *
 * Alert feed, active alerts management, and alert configuration
 */

import React, { useState, useMemo } from 'react';
import {
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  AlertTriangle,
  Gauge,
  Edit2,
  Trash2,
  Power,
  Mail,
  Search,
  X,
  Crown,
} from 'lucide-react';
import {
  triggeredAlerts as initialTriggeredAlerts,
  activeAlerts as initialActiveAlerts,
  alertTypeConfigs,
  currentUserTier,
  tierLimits,
  TriggeredAlert,
  ActiveAlert,
  AlertConditionType,
  NotificationMethod,
} from '../data/mockAlertsData';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { UpgradePrompt } from '../components/common/UpgradePrompt';

export const Alerts: React.FC = () => {
  const { hasAccess, requiredTier } = useFeatureGate('alerts');
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>(initialTriggeredAlerts);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>(initialActiveAlerts);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Block FREE users with upgrade modal
  if (!hasAccess) {
    return (
      <div className="p-6">
        <UpgradePrompt
          feature="alerts"
          variant="modal"
          requiredTier={requiredTier as 'PRO' | 'PREMIUM'}
        />
      </div>
    );
  }
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ActiveAlert | null>(null);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);

  // Create/Edit Alert Form State
  const [formStockSymbol, setFormStockSymbol] = useState('');
  const [formConditionType, setFormConditionType] = useState<AlertConditionType>('price_above');
  const [formThreshold, setFormThreshold] = useState('');
  const [formEmailNotification, setFormEmailNotification] = useState(false);

  // Check tier limits (hasAccess checked above with useFeatureGate)
  const maxAlerts = tierLimits[currentUserTier].maxAlerts;
  const allowedConditions = tierLimits[currentUserTier].allowedConditions;
  const atAlertLimit = activeAlerts.length >= maxAlerts;

  // Mark alert as read
  const handleMarkAsRead = (alertId: string) => {
    setTriggeredAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, isRead: true } : alert))
    );
  };

  // Toggle alert active status
  const handleToggleAlert = (alertId: string) => {
    setActiveAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert))
    );
  };

  // Open edit modal
  const handleEditAlert = (alert: ActiveAlert) => {
    setSelectedAlert(alert);
    setFormStockSymbol(alert.stockSymbol);
    setFormConditionType(alert.conditionType);
    setFormThreshold(alert.threshold.toString());
    setFormEmailNotification(alert.notificationMethod === 'email' || alert.notificationMethod === 'both');
    setShowEditModal(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (alertId: string) => {
    setDeleteAlertId(alertId);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deleteAlertId) {
      setActiveAlerts((prev) => prev.filter((alert) => alert.id !== deleteAlertId));
      setShowDeleteConfirm(false);
      setDeleteAlertId(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormStockSymbol('');
    setFormConditionType('price_above');
    setFormThreshold('');
    setFormEmailNotification(false);
    setSelectedAlert(null);
  };

  // Create alert
  const handleCreateAlert = () => {
    // In real app, this would make an API call
    const newAlert: ActiveAlert = {
      id: `a${Date.now()}`,
      stockSymbol: formStockSymbol.toUpperCase(),
      stockName: formStockSymbol, // In real app, fetch from API
      conditionType: formConditionType,
      conditionSummary: getConditionSummary(formConditionType, parseFloat(formThreshold)),
      threshold: parseFloat(formThreshold),
      isActive: true,
      notificationMethod: formEmailNotification ? 'both' : 'in_app',
      createdAt: new Date(),
    };
    setActiveAlerts((prev) => [newAlert, ...prev]);
    setShowCreateModal(false);
    resetForm();
  };

  // Update alert
  const handleUpdateAlert = () => {
    if (!selectedAlert) return;
    setActiveAlerts((prev) =>
      prev.map((alert) =>
        alert.id === selectedAlert.id
          ? {
              ...alert,
              stockSymbol: formStockSymbol.toUpperCase(),
              conditionType: formConditionType,
              conditionSummary: getConditionSummary(formConditionType, parseFloat(formThreshold)),
              threshold: parseFloat(formThreshold),
              notificationMethod: formEmailNotification ? 'both' : 'in_app',
            }
          : alert
      )
    );
    setShowEditModal(false);
    resetForm();
  };

  // Get condition summary text
  const getConditionSummary = (type: AlertConditionType, threshold: number): string => {
    const config = alertTypeConfigs.find((c) => c.type === type);
    if (!config) return '';

    switch (type) {
      case 'price_above':
        return `Price > ₹${threshold}`;
      case 'price_below':
        return `Price < ₹${threshold}`;
      case 'volume_spike':
        return `Volume > ${threshold}x avg`;
      case 'sentiment_change':
        return `Sentiment shift > ${threshold}`;
      case 'risk_flag':
        return `Risk score > ${threshold}`;
      case 'score_change':
        return `Score change > ${threshold} pts`;
      default:
        return '';
    }
  };

  // Get icon for alert type
  const getAlertIcon = (type: AlertConditionType) => {
    const iconMap = {
      price_above: TrendingUp,
      price_below: TrendingDown,
      volume_spike: Activity,
      sentiment_change: Heart,
      risk_flag: AlertTriangle,
      score_change: Gauge,
    };
    return iconMap[type] || Bell;
  };

  // Get color for alert type
  const getAlertColor = (type: AlertConditionType): string => {
    const config = alertTypeConfigs.find((c) => c.type === type);
    return config?.color || 'signal-blue';
  };

  // Group alerts by date
  const groupedAlerts = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups: { [key: string]: TriggeredAlert[] } = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Earlier: [],
    };

    triggeredAlerts.forEach((alert) => {
      const alertDate = new Date(alert.triggeredAt);
      if (alertDate >= today) {
        groups.Today.push(alert);
      } else if (alertDate >= yesterday) {
        groups.Yesterday.push(alert);
      } else if (alertDate >= thisWeek) {
        groups['This Week'].push(alert);
      } else {
        groups.Earlier.push(alert);
      }
    });

    return groups;
  }, [triggeredAlerts]);

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  // If no access, show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Alerts</h1>
          <p className="text-text-secondary">
            Configure and manage your price alerts and notifications
          </p>
        </div>

        <div className="bg-gradient-to-br from-signal-blue/20 via-bg-secondary to-bg-secondary border border-signal-blue/30 rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-signal-blue/20 mb-6">
            <Bell className="w-8 h-8 text-signal-blue" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            Upgrade to Pro for Stock Alerts
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-8">
            Get real-time notifications when stocks hit your target prices. Set up to 10 price alerts
            on Pro, or unlimited multi-condition alerts (volume, sentiment, risk, scores) on Premium.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-6 py-3 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors">
              Upgrade to Pro
            </button>
            <button className="px-6 py-3 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary">
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Alerts</h1>
          <p className="text-text-secondary">
            Configure and manage your price alerts and notifications
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={atAlertLimit}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            atAlertLimit
              ? 'bg-bg-tertiary text-text-muted cursor-not-allowed'
              : 'bg-signal-blue text-white hover:bg-signal-blue/90'
          }`}
        >
          <Plus className="w-4 h-4" />
          Create Alert
        </button>
      </div>

      {/* Alert limit indicator */}
      <div className="flex items-center justify-between p-3 bg-bg-secondary border border-border-primary rounded-lg">
        <span className="text-sm text-text-secondary">
          Active Alerts: <span className="font-data font-semibold text-text-primary">{activeAlerts.length}</span>
          {maxAlerts !== Infinity && (
            <>
              {' '}
              / <span className="font-data">{maxAlerts}</span>
            </>
          )}
        </span>
        {currentUserTier === 'pro' && (
          <button className="text-sm text-signal-purple hover:underline inline-flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" />
            Upgrade to Premium for Unlimited
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Feed (left, 65%) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Alert Feed</h2>

            {triggeredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">No alerts triggered yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedAlerts).map(
                  ([group, alerts]) =>
                    alerts.length > 0 && (
                      <div key={group}>
                        <h3 className="text-sm font-semibold text-text-secondary mb-3">{group}</h3>
                        <div className="space-y-2">
                          {alerts.map((alert) => {
                            const Icon = getAlertIcon(alert.conditionType);
                            const color = getAlertColor(alert.conditionType);

                            return (
                              <div
                                key={alert.id}
                                onClick={() => !alert.isRead && handleMarkAsRead(alert.id)}
                                className={`p-4 bg-bg-tertiary rounded-lg border-l-4 ${
                                  alert.isRead
                                    ? 'border-transparent'
                                    : 'border-signal-blue cursor-pointer hover:bg-bg-secondary'
                                } transition-colors`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 bg-${color}/10 rounded-lg flex-shrink-0`}>
                                    <Icon className={`w-5 h-5 text-${color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`font-data font-semibold text-signal-blue ${
                                            !alert.isRead ? 'font-bold' : ''
                                          }`}
                                        >
                                          {alert.stockSymbol}
                                        </span>
                                        <span className="text-sm text-text-muted">•</span>
                                        <span
                                          className={`text-sm ${
                                            !alert.isRead
                                              ? 'text-text-primary font-semibold'
                                              : 'text-text-secondary'
                                          }`}
                                        >
                                          {alert.stockName}
                                        </span>
                                      </div>
                                      <span className="text-xs text-text-muted flex-shrink-0">
                                        {formatTimestamp(alert.triggeredAt)}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-sm mb-2 ${
                                        !alert.isRead
                                          ? 'text-text-primary font-semibold'
                                          : 'text-text-secondary'
                                      }`}
                                    >
                                      {alert.conditionDescription}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs">
                                      <span className="text-text-muted">
                                        Current:{' '}
                                        <span className="font-data font-semibold text-text-primary">
                                          {alert.conditionType === 'price_above' ||
                                          alert.conditionType === 'price_below'
                                            ? `₹${alert.currentValue.toFixed(2)}`
                                            : alert.currentValue > 0
                                            ? `+${alert.currentValue.toFixed(2)}`
                                            : alert.currentValue.toFixed(2)}
                                        </span>
                                      </span>
                                      <span className="text-text-muted">
                                        Threshold:{' '}
                                        <span className="font-data text-text-secondary">
                                          {alert.conditionType === 'price_above' ||
                                          alert.conditionType === 'price_below'
                                            ? `₹${alert.threshold.toFixed(2)}`
                                            : alert.threshold.toFixed(2)}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts Sidebar (right, 35%) */}
        <div className="space-y-4">
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Active Alerts</h2>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary mb-4">No alerts configured</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-sm text-signal-blue hover:underline"
                >
                  Create your first alert
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const Icon = getAlertIcon(alert.conditionType);
                  const color = getAlertColor(alert.conditionType);

                  return (
                    <div
                      key={alert.id}
                      className="p-3 bg-bg-tertiary rounded-lg border border-border-primary"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 text-${color}`} />
                          <span className="font-data font-semibold text-signal-blue">
                            {alert.stockSymbol}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleAlert(alert.id)}
                          className={`p-1 rounded transition-colors ${
                            alert.isActive
                              ? 'text-signal-green hover:bg-signal-green/10'
                              : 'text-text-muted hover:bg-bg-secondary'
                          }`}
                          title={alert.isActive ? 'Active' : 'Paused'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{alert.conditionSummary}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAlert(alert)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-bg-secondary hover:bg-bg-primary border border-border-primary rounded text-xs text-text-primary transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(alert.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-bg-secondary hover:bg-signal-red/10 border border-border-primary hover:border-signal-red rounded text-xs text-text-primary hover:text-signal-red transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                      {(alert.notificationMethod === 'email' || alert.notificationMethod === 'both') && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                          <Mail className="w-3 h-3" />
                          Email enabled
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">Create Alert</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Stock Symbol */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Stock Symbol
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={formStockSymbol}
                    onChange={(e) => setFormStockSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g., RELIANCE"
                    className="w-full pl-10 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                  />
                </div>
              </div>

              {/* Condition Type */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Condition Type
                </label>
                <select
                  value={formConditionType}
                  onChange={(e) => setFormConditionType(e.target.value as AlertConditionType)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-signal-blue"
                >
                  {alertTypeConfigs
                    .filter((config) => allowedConditions.includes(config.type))
                    .map((config) => (
                      <option key={config.type} value={config.type}>
                        {config.label}
                      </option>
                    ))}
                </select>
                {currentUserTier === 'pro' && (
                  <p className="text-xs text-text-muted mt-2">
                    💡 Upgrade to Premium for advanced conditions (volume, sentiment, risk, scores)
                  </p>
                )}
              </div>

              {/* Threshold */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {alertTypeConfigs.find((c) => c.type === formConditionType)?.thresholdLabel ||
                    'Threshold'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder="Enter value"
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                  />
                  {alertTypeConfigs.find((c) => c.type === formConditionType)?.thresholdUnit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                      {alertTypeConfigs.find((c) => c.type === formConditionType)?.thresholdUnit}
                    </span>
                  )}
                </div>
              </div>

              {/* Notification Method */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Notification Method
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-text-primary">
                    <Bell className="w-4 h-4 text-signal-blue" />
                    In-app (default)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEmailNotification}
                      onChange={(e) => setFormEmailNotification(e.target.checked)}
                      className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-signal-blue focus:ring-2 focus:ring-signal-blue"
                    />
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleCreateAlert}
                disabled={!formStockSymbol || !formThreshold}
                className="flex-1 px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Alert
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Alert Modal */}
      {showEditModal && selectedAlert && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowEditModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">Edit Alert</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Stock Symbol (disabled for edit) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Stock Symbol
                </label>
                <input
                  type="text"
                  value={formStockSymbol}
                  disabled
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-muted cursor-not-allowed"
                />
              </div>

              {/* Condition Type */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Condition Type
                </label>
                <select
                  value={formConditionType}
                  onChange={(e) => setFormConditionType(e.target.value as AlertConditionType)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-signal-blue"
                >
                  {alertTypeConfigs
                    .filter((config) => allowedConditions.includes(config.type))
                    .map((config) => (
                      <option key={config.type} value={config.type}>
                        {config.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Threshold */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {alertTypeConfigs.find((c) => c.type === formConditionType)?.thresholdLabel ||
                    'Threshold'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder="Enter value"
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                  />
                  {alertTypeConfigs.find((c) => c.type === formConditionType)?.thresholdUnit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                      {alertTypeConfigs.find((c) => c.type === formConditionType)?.thresholdUnit}
                    </span>
                  )}
                </div>
              </div>

              {/* Notification Method */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Notification Method
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-text-primary">
                    <Bell className="w-4 h-4 text-signal-blue" />
                    In-app (default)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEmailNotification}
                      onChange={(e) => setFormEmailNotification(e.target.checked)}
                      className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-signal-blue focus:ring-2 focus:ring-signal-blue"
                    />
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleUpdateAlert}
                disabled={!formStockSymbol || !formThreshold}
                className="flex-1 px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Alert
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeleteAlertId(null);
          }}
        >
          <div
            className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-signal-red/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-signal-red" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Alert?</h3>
                <p className="text-sm text-text-secondary">
                  This alert will be permanently deleted. You will no longer receive notifications
                  for this condition.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-signal-red text-white rounded-lg font-medium hover:bg-signal-red/90 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteAlertId(null);
                }}
                className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
