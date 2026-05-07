/**
 * Settings Page
 *
 * User profile, preferences, API keys, and account management
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Bell,
  Palette,
  BarChart3,
  Table,
  Key,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Check,
  Copy,
  Plus,
  AlertTriangle,
  CreditCard,
  Crown,
} from 'lucide-react';
import {
  userProfile as initialUserProfile,
  userPreferences as initialUserPreferences,
  apiKeys as initialAPIKeys,
  apiUsageStats,
  watchlistOptions,
  screenerPresetOptions,
  chartPeriodOptions,
  tablePageSizeOptions,
  tierLimits,
  currentUserTier,
  UserProfile,
  UserPreferences,
  APIKey,
} from '../data/mockSettingsData';

export const Settings: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(initialUserPreferences);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>(initialAPIKeys);

  // Form states
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userProfile.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal states
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showGenerateKeyModal, setShowGenerateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showRevokeKeyModal, setShowRevokeKeyModal] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  // Check tier access
  const canAccessAPIKeys = tierLimits[currentUserTier].canAccessAPIKeys;

  // Handle name save
  const handleSaveName = () => {
    setUserProfile({ ...userProfile, name: nameValue });
    setEditingName(false);
  };

  // Handle password change
  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // In real app, make API call
    alert('Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle preference changes
  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setUserPreferences({ ...userPreferences, [key]: value });
  };

  // Handle generate API key
  const handleGenerateKey = () => {
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 18)}`;
    const apiKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: newKey,
      createdAt: new Date(),
      lastUsed: null,
      callsToday: 0,
    };
    setAPIKeys([...apiKeys, apiKey]);
    setGeneratedKey(newKey);
    setNewKeyName('');
  };

  // Handle copy API key
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Handle revoke API key
  const handleRevokeKey = () => {
    if (keyToRevoke) {
      setAPIKeys(apiKeys.filter((k) => k.id !== keyToRevoke));
      setShowRevokeKeyModal(false);
      setKeyToRevoke(null);
    }
  };

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    const newRevealed = new Set(revealedKeys);
    if (newRevealed.has(keyId)) {
      newRevealed.delete(keyId);
    } else {
      newRevealed.add(keyId);
    }
    setRevealedKeys(newRevealed);
  };

  // Mask API key
  const maskKey = (key: string, reveal: boolean): string => {
    if (reveal) return key;
    return key.substring(0, 8) + '••••••••••••••••' + key.substring(key.length - 4);
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      // In real app, make API call
      alert('Account deleted');
      setShowDeleteConfirmModal(false);
      setShowDeleteAccountModal(false);
      setDeleteConfirmText('');
    }
  };

  // Format date
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">
            Manage your account, preferences, and billing
          </p>
        </div>
        <Link
          to="/settings/billing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-secondary text-text-primary rounded-lg font-medium hover:bg-bg-tertiary transition-colors border border-border-primary"
        >
          <CreditCard className="w-4 h-4" />
          Billing
        </Link>
      </div>

      {/* 1. Profile Section */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </h2>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Name
            </label>
            <div className="flex items-center gap-3">
              {editingName ? (
                <>
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-signal-blue"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameValue(userProfile.name);
                    }}
                    className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-text-primary">{userProfile.name}</span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <div className="flex items-center gap-3 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg">
              <Mail className="w-4 h-4 text-text-muted" />
              <span className="flex-1 text-text-muted">{userProfile.email}</span>
              {userProfile.emailVerified && (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-signal-green/10 border border-signal-green/30 rounded text-xs font-medium text-signal-green">
                  <Check className="w-3 h-3" />
                  Verified
                </div>
              )}
            </div>
          </div>

          {/* Password Change */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-3 py-2 pr-10 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                />
                <button
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-3 py-2 pr-10 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 pr-10 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Preferences Section */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Preferences</h2>

        <div className="space-y-6">
          {/* Default Watchlist */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Default Watchlist
            </label>
            <select
              value={userPreferences.defaultWatchlist}
              onChange={(e) => handlePreferenceChange('defaultWatchlist', e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-signal-blue"
            >
              {watchlistOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Default Screener Preset */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Default Screener Preset
            </label>
            <select
              value={userPreferences.defaultScreenerPreset}
              onChange={(e) => handlePreferenceChange('defaultScreenerPreset', e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-signal-blue"
            >
              {screenerPresetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Notification Preferences */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notification Preferences
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-bg-tertiary border border-border-primary rounded-lg cursor-pointer hover:bg-bg-secondary transition-colors">
                <span className="text-text-primary">In-app notifications</span>
                <input
                  type="checkbox"
                  checked={userPreferences.notificationsInApp}
                  onChange={(e) => handlePreferenceChange('notificationsInApp', e.target.checked)}
                  className="w-5 h-5 rounded border-border-primary bg-bg-tertiary checked:bg-signal-blue focus:ring-2 focus:ring-signal-blue"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-bg-tertiary border border-border-primary rounded-lg cursor-pointer hover:bg-bg-secondary transition-colors">
                <span className="text-text-primary">Email notifications</span>
                <input
                  type="checkbox"
                  checked={userPreferences.notificationsEmail}
                  onChange={(e) => handlePreferenceChange('notificationsEmail', e.target.checked)}
                  className="w-5 h-5 rounded border-border-primary bg-bg-tertiary checked:bg-signal-blue focus:ring-2 focus:ring-signal-blue"
                />
              </label>
            </div>
          </div>

          {/* Theme Toggle */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePreferenceChange('theme', 'dark')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors border ${
                  userPreferences.theme === 'dark'
                    ? 'bg-signal-blue text-white border-signal-blue'
                    : 'bg-bg-tertiary text-text-primary border-border-primary hover:bg-bg-secondary'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => handlePreferenceChange('theme', 'light')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors border ${
                  userPreferences.theme === 'light'
                    ? 'bg-signal-blue text-white border-signal-blue'
                    : 'bg-bg-tertiary text-text-primary border-border-primary hover:bg-bg-secondary'
                }`}
              >
                Light
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Data Preferences Section */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Data Preferences</h2>

        <div className="space-y-6">
          {/* Default Chart Period */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Default Chart Period
            </label>
            <select
              value={userPreferences.defaultChartPeriod}
              onChange={(e) => handlePreferenceChange('defaultChartPeriod', e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-signal-blue"
            >
              {chartPeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Table Page Size */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
              <Table className="w-4 h-4" />
              Default Table Page Size
            </label>
            <select
              value={userPreferences.defaultTablePageSize}
              onChange={(e) => handlePreferenceChange('defaultTablePageSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-signal-blue"
            >
              {tablePageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} rows per page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. API Keys Section (Premium only) */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-text-primary" />
            <h2 className="text-xl font-semibold text-text-primary">API Keys</h2>
            {currentUserTier === 'premium' && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-signal-purple/10 border border-signal-purple/30 rounded text-xs font-medium text-signal-purple">
                <Crown className="w-3 h-3" />
                Premium
              </div>
            )}
          </div>
          {canAccessAPIKeys && (
            <button
              onClick={() => setShowGenerateKeyModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate Key
            </button>
          )}
        </div>

        {!canAccessAPIKeys ? (
          <div className="text-center py-12 bg-gradient-to-br from-signal-purple/10 to-transparent border border-signal-purple/20 rounded-lg">
            <Crown className="w-12 h-12 text-signal-purple mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Upgrade to Premium for API Access
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Get programmatic access to Alpha Signal data with 10,000 API calls per day
            </p>
            <Link
              to="/settings/billing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-signal-purple text-white rounded-lg font-medium hover:bg-signal-purple/90 transition-colors"
            >
              View Plans
            </Link>
          </div>
        ) : (
          <>
            {/* Usage Stats */}
            <div className="mb-6 p-4 bg-bg-tertiary border border-border-primary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">API Usage Today</span>
                <span className="text-sm font-data font-semibold text-text-primary">
                  {apiUsageStats.callsToday.toLocaleString()} / {apiUsageStats.dailyLimit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-signal-blue rounded-full transition-all"
                  style={{ width: `${(apiUsageStats.callsToday / apiUsageStats.dailyLimit) * 100}%` }}
                />
              </div>
            </div>

            {/* API Keys List */}
            {apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-10 h-10 text-text-muted mx-auto mb-2" />
                <p className="text-text-secondary mb-4">No API keys generated yet</p>
                <button
                  onClick={() => setShowGenerateKeyModal(true)}
                  className="text-sm text-signal-blue hover:underline"
                >
                  Generate your first API key
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="p-4 bg-bg-tertiary border border-border-primary rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-text-primary mb-1">{apiKey.name}</h3>
                        <p className="text-xs text-text-muted">
                          Created {formatDate(apiKey.createdAt)} • Last used {formatDate(apiKey.lastUsed)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setKeyToRevoke(apiKey.id);
                          setShowRevokeKeyModal(true);
                        }}
                        className="p-1.5 text-signal-red hover:bg-signal-red/10 rounded transition-colors"
                        title="Revoke key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded font-mono text-sm text-text-primary">
                        {maskKey(apiKey.key, revealedKeys.has(apiKey.id))}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="p-2 bg-bg-secondary hover:bg-bg-primary border border-border-primary rounded transition-colors"
                        title={revealedKeys.has(apiKey.id) ? 'Hide' : 'Reveal'}
                      >
                        {revealedKeys.has(apiKey.id) ? (
                          <EyeOff className="w-4 h-4 text-text-primary" />
                        ) : (
                          <Eye className="w-4 h-4 text-text-primary" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopyKey(apiKey.key)}
                        className="p-2 bg-bg-secondary hover:bg-bg-primary border border-border-primary rounded transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4 text-text-primary" />
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-text-muted">
                      Calls today: <span className="font-data font-semibold text-text-primary">{apiKey.callsToday}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Account Section */}
      <div className="bg-bg-secondary border border-signal-red/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Account
        </h2>

        <div className="flex items-start gap-4 p-4 bg-signal-red/5 border border-signal-red/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-signal-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Delete Account</h3>
            <p className="text-sm text-text-secondary mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="px-4 py-2 bg-signal-red text-white rounded-lg font-medium hover:bg-signal-red/90 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Generate API Key Modal */}
      {showGenerateKeyModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowGenerateKeyModal(false);
            setNewKeyName('');
            setGeneratedKey(null);
            setCopiedKey(false);
          }}
        >
          <div
            className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              {generatedKey ? 'API Key Generated' : 'Generate API Key'}
            </h3>

            {!generatedKey ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API"
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-blue"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateKey}
                    disabled={!newKeyName}
                    className="flex-1 px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate
                  </button>
                  <button
                    onClick={() => {
                      setShowGenerateKeyModal(false);
                      setNewKeyName('');
                    }}
                    className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 bg-signal-yellow/10 border border-signal-yellow/30 rounded-lg">
                  <p className="text-sm text-text-primary flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-signal-yellow flex-shrink-0 mt-0.5" />
                    <span>
                      Make sure to copy your API key now. You won't be able to see it again!
                    </span>
                  </p>
                </div>
                <div className="mb-6">
                  <code className="block px-3 py-2 bg-bg-tertiary border border-border-primary rounded font-mono text-sm text-text-primary break-all">
                    {generatedKey}
                  </code>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopyKey(generatedKey)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedKey ? 'Copied!' : 'Copy Key'}
                  </button>
                  <button
                    onClick={() => {
                      setShowGenerateKeyModal(false);
                      setGeneratedKey(null);
                      setCopiedKey(false);
                    }}
                    className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Revoke API Key Modal */}
      {showRevokeKeyModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowRevokeKeyModal(false);
            setKeyToRevoke(null);
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
                <h3 className="text-lg font-semibold text-text-primary mb-2">Revoke API Key?</h3>
                <p className="text-sm text-text-secondary">
                  This will permanently revoke the API key. Any applications using this key will no
                  longer be able to access the API.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRevokeKey}
                className="flex-1 px-4 py-2 bg-signal-red text-white rounded-lg font-medium hover:bg-signal-red/90 transition-colors"
              >
                Revoke
              </button>
              <button
                onClick={() => {
                  setShowRevokeKeyModal(false);
                  setKeyToRevoke(null);
                }}
                className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal (First Confirmation) */}
      {showDeleteAccountModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteAccountModal(false)}
        >
          <div
            className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-signal-red/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-signal-red" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Are you sure you want to delete your account?
                </h3>
                <p className="text-sm text-text-secondary">
                  This action will permanently delete:
                </p>
                <ul className="mt-2 text-sm text-text-secondary space-y-1 list-disc list-inside">
                  <li>Your profile and settings</li>
                  <li>All watchlists and screener presets</li>
                  <li>Portfolio data and alerts</li>
                  <li>Billing history</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setShowDeleteConfirmModal(true);
                }}
                className="flex-1 px-4 py-2 bg-signal-red text-white rounded-lg font-medium hover:bg-signal-red/90 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal (Second Confirmation) */}
      {showDeleteConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowDeleteConfirmModal(false);
            setDeleteConfirmText('');
          }}
        >
          <div
            className="bg-bg-secondary border border-signal-red rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 bg-signal-red/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-signal-red" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Final Confirmation
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Type <span className="font-mono font-bold text-text-primary">DELETE</span> to
                  permanently delete your account.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-signal-red"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-signal-red text-white rounded-lg font-medium hover:bg-signal-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Account
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteConfirmText('');
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

export default Settings;
