import React, { useState, useEffect, useMemo } from 'react';
import {
  adminGetStatus,
  adminLogin,
  adminRegister,
  adminGetStats,
  adminGetUsers,
  adminDeleteUser,
  adminLogout,
  getAdminUser,
  isAdminAuthenticated,
} from '../api';
import LucoLogo from './LucoLogo';
import './AdminPortal.css';
import {
  Shield,
  Users,
  UserCheck,
  Briefcase,
  Search,
  Trash2,
  LogOut,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  MapPin,
  Calendar,
  Menu,
  X,
  LayoutDashboard,
  ArrowLeft,
  TrendingUp,
  Activity,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PieChart,
  BarChart3,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface AdminPortalProps {
  onBackToSite: () => void;
}

export default function AdminPortal({ onBackToSite }: AdminPortalProps) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [adminUser, setAdminUser] = useState<any>(() => getAdminUser());
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [hasExistingAdmin, setHasExistingAdmin] = useState<boolean>(true);
  const [isCheckingSetup, setIsCheckingSetup] = useState<boolean>(true);

  // Auth form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard & Users list states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'all' | 'candidates' | 'recruiters'>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCandidates: 0,
    totalRecruiters: 0,
    totalUsers: 0,
    totalAdmins: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [chartTimeRange, setChartTimeRange] = useState<'7d' | '14d'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Delete modal states
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check setup status on load: whether an admin already exists
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await adminGetStatus();
        setHasExistingAdmin(res.hasAdmin);
        if (!res.hasAdmin) {
          setAuthMode('register');
        } else {
          setAuthMode('login');
        }
      } catch (err: any) {
        console.warn('Admin status check warning:', err.message);
      } finally {
        setIsCheckingSetup(false);
      }
    };
    checkSetup();
  }, []);

  // Fetch users and stats when authenticated
  const loadDashboardData = async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminGetUsers(),
        adminGetStats().catch(() => null),
      ]);

      if (usersRes?.users) {
        setUsers(usersRes.users);
      }
      if (statsRes) {
        setStats(statsRes);
      } else if (usersRes?.users) {
        const candidates = usersRes.users.filter((u: any) => u.role === 'candidate').length;
        const recruiters = usersRes.users.filter((u: any) => u.role === 'recruiter').length;
        setStats({
          totalCandidates: candidates,
          totalRecruiters: recruiters,
          totalUsers: usersRes.users.length,
          totalAdmins: 1,
        });
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      if (err.message?.includes('denied') || err.message?.includes('authenticated')) {
        handleLogout();
        showToast('Session expired. Please log in again.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // Auth submission (Login or First-time only Register)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'register') {
      if (!name.trim()) {
        setAuthError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        const res = await adminRegister({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        setAdminUser(res.user);
        setIsAuthenticated(true);
        setHasExistingAdmin(true);
        showToast('Primary administrator account created successfully!');
      } else {
        const res = await adminLogin(email.trim().toLowerCase(), password);
        setAdminUser(res.user);
        setIsAuthenticated(true);
        showToast(`Welcome back, ${res.user?.name || 'Admin'}!`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    setAdminUser(null);
    setAuthMode('login');
    showToast('Admin logged out successfully.');
  };

  // Delete operation
  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await adminDeleteUser(userToDelete.role, userToDelete.id);
      setUsers((prev) => prev.filter((u) => !(u.id === userToDelete.id && u.role === userToDelete.role)));
      setStats((prev: any) => ({
        ...prev,
        totalUsers: Math.max(0, prev.totalUsers - 1),
        totalCandidates: userToDelete.role === 'candidate' ? Math.max(0, prev.totalCandidates - 1) : prev.totalCandidates,
        totalRecruiters: userToDelete.role === 'recruiter' ? Math.max(0, prev.totalRecruiters - 1) : prev.totalRecruiters,
      }));
      showToast(`${userToDelete.role === 'candidate' ? 'Candidate' : 'Recruiter'} "${userToDelete.name}" deleted successfully.`);
      setUserToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered users list based on active tab and search query
  const filteredUsers = useMemo(() => {
    let list = users;
    if (activeTab === 'candidates') {
      list = list.filter((u) => u.role === 'candidate');
    } else if (activeTab === 'recruiters') {
      list = list.filter((u) => u.role === 'recruiter');
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.trim().toLowerCase();
    return list.filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const mobile = (u.mobile || '').toLowerCase();
      const title = (u.title || '').toLowerCase();
      const company = (u.company || '').toLowerCase();
      const city = (u.city || '').toLowerCase();
      const role = (u.role || '').toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        mobile.includes(query) ||
        title.includes(query) ||
        company.includes(query) ||
        city.includes(query) ||
        role.includes(query)
      );
    });
  }, [users, activeTab, searchQuery]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, pageSize]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format relative time helper for activity feed
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSec = Math.max(0, Math.floor(diffMs / 1000));
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateStr);
    } catch {
      return 'Recently';
    }
  };

  // Dynamic Chart Data aggregated by day for the last 7 or 14 days
  const chartData = useMemo(() => {
    const dayCount = chartTimeRange === '7d' ? 7 : 14;
    const days: { label: string; dateKey: string; total: number; candidates: number; recruiters: number }[] = [];
    const now = new Date();

    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', {
        weekday: dayCount <= 7 ? 'short' : undefined,
        day: 'numeric',
        month: 'short',
      });
      days.push({ label, dateKey, total: 0, candidates: 0, recruiters: 0 });
    }

    users.forEach((u) => {
      if (!u.created_at) return;
      try {
        const uDate = new Date(u.created_at).toISOString().split('T')[0];
        const match = days.find((d) => d.dateKey === uDate);
        if (match) {
          match.total += 1;
          if (u.role === 'candidate') match.candidates += 1;
          if (u.role === 'recruiter') match.recruiters += 1;
        }
      } catch {
        // ignore invalid dates
      }
    });

    return days;
  }, [users, chartTimeRange]);

  const maxChartValue = useMemo(() => {
    return Math.max(...chartData.map((d) => d.total), 4);
  }, [chartData]);

  // Recent 5 registered users
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [users]);

  // Real-time activity feed derived from users and admin activity
  const recentActivities = useMemo(() => {
    const list: any[] = [];
    const sorted = [...users].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    sorted.slice(0, 6).forEach((u) => {
      list.push({
        id: `user-${u.role}-${u.id}`,
        type: u.role,
        title: `${u.name || 'New user'} registered`,
        subtitle:
          u.role === 'candidate'
            ? `Joined as Freelancer (${u.title || 'Candidate'})`
            : `Joined as Employer (${u.company || 'Recruiter'})`,
        time: u.created_at,
        icon: u.role === 'candidate' ? UserCheck : Briefcase,
        badge: u.role === 'candidate' ? 'Candidate' : 'Recruiter',
        badgeClass: u.role === 'candidate' ? 'candidate' : 'recruiter',
      });
    });

    // Add admin session entry
    list.unshift({
      id: 'admin-live-session',
      type: 'admin',
      title: 'Admin Session Active',
      subtitle: `Authenticated as ${adminUser?.name || 'Super Admin'}`,
      time: new Date().toISOString(),
      icon: Shield,
      badge: 'Admin',
      badgeClass: 'admin',
    });

    return list.slice(0, 6);
  }, [users, adminUser]);

  // ==========================================
  // RENDER: LOGIN / FIRST-TIME REGISTER
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="admin-portal-wrapper">
        <div className="admin-auth-screen">
          <div className="admin-auth-box">
            <div className="admin-auth-header">
              {/* Exact Landing Page Logo Header */}
              <div className="admin-brand-logo-center" onClick={onBackToSite}>
                <div className="admin-brand-logo-icon">
                  <LucoLogo size={20} />
                </div>
                <div className="admin-brand-logo-text">
                  <span className="luco">Luco</span>
                  <span className="hire">Hire</span>
                </div>
              </div>

              <div>
                <span className="admin-badge-pill">
                  <Shield size={11} />
                  Admin Console
                </span>
              </div>

              <h1 className="admin-auth-heading">
                {!hasExistingAdmin && authMode === 'register'
                  ? 'First-Time Admin Setup'
                  : 'Administrator Sign In'}
              </h1>
              <p className="admin-auth-subheading">
                {!hasExistingAdmin && authMode === 'register'
                  ? 'No administrator exists yet. Create the primary admin account.'
                  : 'Enter your credentials to access the LucoHire admin panel.'}
              </p>
            </div>

            {!hasExistingAdmin && !isCheckingSetup && (
              <div className="admin-notice-banner">
                <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>First-Time Setup Mode</strong>
                  <div>Once this primary account is registered, registration is closed.</div>
                </div>
              </div>
            )}

            {authError && (
              <div className="admin-error-banner">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {!hasExistingAdmin && authMode === 'register' && (
                <div className="admin-field-group">
                  <label className="admin-field-label">Full Name</label>
                  <div className="admin-field-control">
                    <User size={16} className="admin-field-icon" />
                    <input
                      type="text"
                      className="admin-field-input"
                      placeholder="e.g. Master Admin"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="admin-field-group">
                <label className="admin-field-label">Admin Email</label>
                <div className="admin-field-control">
                  <Mail size={16} className="admin-field-icon" />
                  <input
                    type="email"
                    className="admin-field-input"
                    placeholder="admin@lucohire.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Password</label>
                <div className="admin-field-control">
                  <Lock size={16} className="admin-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="admin-field-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="admin-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!hasExistingAdmin && authMode === 'register' && (
                <div className="admin-field-group">
                  <label className="admin-field-label">Confirm Password</label>
                  <div className="admin-field-control">
                    <Lock size={16} className="admin-field-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="admin-field-input"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="admin-submit-btn" disabled={authLoading}>
                {authLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : !hasExistingAdmin && authMode === 'register' ? (
                  'Create Primary Admin'
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            <button type="button" className="admin-return-link" onClick={onBackToSite}>
              <ArrowLeft size={14} />
              Return to LucoHire Website
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="admin-toast">
            <CheckCircle2 size={18} color="#16A34A" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  const candidateCount = stats.totalCandidates || users.filter((u) => u.role === 'candidate').length;
  const recruiterCount = stats.totalRecruiters || users.filter((u) => u.role === 'recruiter').length;
  const totalUserCount = stats.totalUsers || users.length;

  return (
    <div className="admin-portal-wrapper">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            {/* Exact Landing Page Logo Format */}
            <div className="admin-brand-group" onClick={onBackToSite} style={{ cursor: 'pointer' }}>
              <div className="admin-sidebar-logo-container">
                <LucoLogo size={20} />
              </div>
              <div className="admin-sidebar-logo-text">
                <span className="luco">Luco</span>
                <span className="hire">Hire</span>
              </div>
            </div>

            <span className="admin-sidebar-tag">
              <span className="admin-live-dot" />
              Live Admin
            </span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-menu-section-label">Platform Navigation</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileSidebarOpen(false);
            }}
          >
            <div className="admin-nav-left">
              <span className="admin-nav-icon-badge overview">
                <LayoutDashboard size={15} />
              </span>
              <span>Overview</span>
            </div>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('all');
              setIsMobileSidebarOpen(false);
            }}
          >
            <div className="admin-nav-left">
              <span className="admin-nav-icon-badge all">
                <Users size={15} />
              </span>
              <span>All Users</span>
            </div>
            <span className="admin-nav-count">{totalUserCount}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('candidates');
              setIsMobileSidebarOpen(false);
            }}
          >
            <div className="admin-nav-left">
              <span className="admin-nav-icon-badge candidates">
                <UserCheck size={15} />
              </span>
              <span>Candidates</span>
            </div>
            <span className="admin-nav-count">{candidateCount}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'recruiters' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('recruiters');
              setIsMobileSidebarOpen(false);
            }}
          >
            <div className="admin-nav-left">
              <span className="admin-nav-icon-badge recruiters">
                <Briefcase size={15} />
              </span>
              <span>Recruiters</span>
            </div>
            <span className="admin-nav-count">{recruiterCount}</span>
          </button>
        </nav>

        {/* Sidebar Platform Live Status Mini-Card */}
        <div className="admin-sidebar-status-card">
          <div className="admin-status-card-header">
            <span className="admin-status-card-title">User Distribution</span>
            <span className="admin-status-card-badge">
              <span className="admin-live-dot" />
              100% Active
            </span>
          </div>

          <div className="admin-progress-bar-wrap" title={`Candidates: ${candidateCount}, Recruiters: ${recruiterCount}`}>
            <div
              className="admin-progress-fill-candidate"
              style={{
                width: `${totalUserCount > 0 ? (candidateCount / totalUserCount) * 100 : 50}%`
              }}
            />
            <div
              className="admin-progress-fill-recruiter"
              style={{
                width: `${totalUserCount > 0 ? (recruiterCount / totalUserCount) * 100 : 50}%`
              }}
            />
          </div>

          <div className="admin-status-stats-row">
            <div
              className="admin-status-stat-item"
              onClick={() => setActiveTab('candidates')}
              style={{ cursor: 'pointer' }}
              title="Filter Candidates"
            >
              <span className="admin-legend-dot candidate" />
              <span>{candidateCount} Freelancers</span>
            </div>
            <div
              className="admin-status-stat-item"
              onClick={() => setActiveTab('recruiters')}
              style={{ cursor: 'pointer' }}
              title="Filter Recruiters"
            >
              <span className="admin-legend-dot recruiter" />
              <span>{recruiterCount} Recruiters</span>
            </div>
          </div>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-profile-card">
            <div className="admin-avatar-wrap">
              <div className="admin-avatar">
                {(adminUser?.name || 'A')[0].toUpperCase()}
              </div>
              <span className="admin-avatar-status-dot" />
            </div>
            <div className="admin-profile-info">
              <div className="admin-profile-name">{adminUser?.name || 'Administrator'}</div>
              <div className="admin-profile-email">{adminUser?.email || 'admin@lucohire.com'}</div>
            </div>
          </div>

          <div className="admin-sidebar-actions">
            <button
              type="button"
              className="admin-footer-btn"
              onClick={onBackToSite}
              title="Return to Main Website"
            >
              <ExternalLink size={13} />
              <span>Live Site</span>
            </button>
            <button
              type="button"
              className="admin-footer-btn logout"
              onClick={handleLogout}
              title="Sign Out of Admin"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-area">
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="admin-page-heading">
              {activeTab === 'dashboard'
                ? 'System Overview'
                : activeTab === 'candidates'
                ? 'Candidates'
                : activeTab === 'recruiters'
                ? 'Recruiters'
                : 'All Registered Users'}
            </h1>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={loadDashboardData}
              disabled={isLoadingData}
            >
              <RefreshCw size={13} className={isLoadingData ? 'animate-spin' : ''} />
              <span>{isLoadingData ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button type="button" className="admin-view-site-btn" onClick={onBackToSite}>
              <ArrowLeft size={13} />
              <span>Back to Site</span>
            </button>
          </div>
        </header>

        {/* Body Content */}
        <div className="admin-content-body">
          {/* Key Metric Stats Cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrapper total">
                <Users size={22} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-label">Total Signups</span>
                <span className="admin-stat-value">{totalUserCount}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrapper candidates">
                <UserCheck size={22} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-label">Candidates</span>
                <span className="admin-stat-value">{candidateCount}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrapper recruiters">
                <Briefcase size={22} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-label">Recruiters</span>
                <span className="admin-stat-value">{recruiterCount}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrapper admins">
                <Shield size={22} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-label">Admins</span>
                <span className="admin-stat-value">{stats.totalAdmins || 1}</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              VIEW 1: SYSTEM OVERVIEW (GRAPH + RECENT DATA + ACTIVITY)
              ======================================================== */}
          {activeTab === 'dashboard' ? (
            <div className="admin-overview-container">
              {/* Analytics & Visual Graphs Row */}
              <div className="admin-analytics-grid">
                {/* Visual Registration Trends Graph */}
                <div className="admin-card-panel admin-graph-card">
                  <div className="admin-panel-header">
                    <div>
                      <div className="admin-panel-badge">
                        <TrendingUp size={12} />
                        Analytics Growth
                      </div>
                      <h2 className="admin-panel-title">User Registration Trends</h2>
                      <p className="admin-panel-subtitle">Daily user onboarding across Candidates & Recruiters</p>
                    </div>

                    <div className="admin-chart-controls">
                      <button
                        type="button"
                        className={`admin-chart-btn ${chartTimeRange === '7d' ? 'active' : ''}`}
                        onClick={() => setChartTimeRange('7d')}
                      >
                        Last 7 Days
                      </button>
                      <button
                        type="button"
                        className={`admin-chart-btn ${chartTimeRange === '14d' ? 'active' : ''}`}
                        onClick={() => setChartTimeRange('14d')}
                      >
                        Last 14 Days
                      </button>
                    </div>
                  </div>

                  {/* SVG Line / Area Graph */}
                  <div className="admin-chart-wrapper">
                    <svg
                      viewBox="0 0 540 180"
                      className="admin-growth-svg"
                      preserveAspectRatio="none"
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <defs>
                        <linearGradient id="lucoAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1A52F5" stopOpacity="0.35" />
                          <stop offset="60%" stopColor="#6E02E6" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#6E02E6" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lucoLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0080FF" />
                          <stop offset="50%" stopColor="#1A52F5" />
                          <stop offset="100%" stopColor="#6E02E6" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      {[0, 1, 2, 3].map((gridIndex) => {
                        const yPos = 20 + gridIndex * 40;
                        const labelVal = Math.round(maxChartValue * (1 - gridIndex / 3));
                        return (
                          <g key={gridIndex} pointerEvents="none">
                            <line
                              x1="45"
                              y1={yPos}
                              x2="520"
                              y2={yPos}
                              stroke="#ECEAF9"
                              strokeDasharray="4 4"
                              strokeWidth="1"
                            />
                            <text
                              x="38"
                              y={yPos + 4}
                              textAnchor="end"
                              fill="#9AA0B4"
                              fontSize="10"
                              fontFamily="Space Grotesk, sans-serif"
                            >
                              {labelVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Fill and Stroke Paths */}
                      {chartData.length > 1 && (
                        <g pointerEvents="none">
                          {/* Shaded Area */}
                          <path
                            d={`
                              M ${45},140
                              ${chartData
                                .map((pt, idx) => {
                                  const x = 45 + (idx / (chartData.length - 1)) * 475;
                                  const y = 140 - (pt.total / maxChartValue) * 120;
                                  return `L ${x.toFixed(1)},${y.toFixed(1)}`;
                                })
                                .join(' ')}
                              L ${520},140 Z
                            `}
                            fill="url(#lucoAreaGradient)"
                          />

                          {/* Line Stroke */}
                          <path
                            d={`
                              M ${chartData
                                .map((pt, idx) => {
                                  const x = 45 + (idx / (chartData.length - 1)) * 475;
                                  const y = 140 - (pt.total / maxChartValue) * 120;
                                  return `${idx === 0 ? '' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
                                })
                                .join(' ')}
                            `}
                            fill="none"
                            stroke="url(#lucoLineGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      )}

                      {/* Hover Guideline (Vertical) */}
                      {hoveredPoint && chartData.length > 1 && (() => {
                        const hoverIdx = chartData.findIndex((d) => d.dateKey === hoveredPoint.dateKey);
                        if (hoverIdx < 0) return null;
                        const hoverX = 45 + (hoverIdx / (chartData.length - 1)) * 475;
                        return (
                          <line
                            x1={hoverX}
                            y1={15}
                            x2={hoverX}
                            y2={145}
                            stroke="rgba(110, 2, 230, 0.4)"
                            strokeDasharray="3 3"
                            strokeWidth="1.5"
                            pointerEvents="none"
                          />
                        );
                      })()}

                      {/* Visible Data Point Markers & Labels (pointerEvents="none" avoids boundary flutter) */}
                      {chartData.map((pt, idx) => {
                        const x = 45 + (idx / (chartData.length - 1)) * 475;
                        const y = 140 - (pt.total / maxChartValue) * 120;
                        const isHovered = hoveredPoint?.dateKey === pt.dateKey;
                        return (
                          <g key={`marker-${pt.dateKey}`} pointerEvents="none">
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered ? 6.5 : 4}
                              fill={isHovered ? '#6E02E6' : '#FFFFFF'}
                              stroke={isHovered ? '#FFFFFF' : '#1A52F5'}
                              strokeWidth={isHovered ? 2.5 : 2}
                              className="admin-chart-dot"
                            />
                            {/* X-axis date labels */}
                            <text
                              x={x}
                              y="165"
                              textAnchor="middle"
                              fill={isHovered ? '#1C1733' : '#75708F'}
                              fontWeight={isHovered ? '700' : '500'}
                              fontSize="9.5"
                              fontFamily="Space Grotesk, sans-serif"
                            >
                              {pt.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* Smooth Full-Height Column Hit Areas (no flickering) */}
                      {chartData.map((pt, idx) => {
                        const stepWidth = 475 / Math.max(1, chartData.length - 1);
                        const xCenter = 45 + idx * stepWidth;
                        const rectX = Math.max(20, xCenter - stepWidth / 2);
                        const rectWidth = stepWidth;
                        return (
                          <rect
                            key={`hit-${pt.dateKey}`}
                            x={rectX}
                            y={10}
                            width={rectWidth}
                            height={160}
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredPoint(pt)}
                          />
                        );
                      })}
                    </svg>

                    {/* Hover Tooltip Box */}
                    {hoveredPoint && (
                      <div className="admin-chart-hover-tooltip">
                        <div className="tooltip-title">{hoveredPoint.label}</div>
                        <div className="tooltip-stat">
                          <strong>{hoveredPoint.total}</strong> Total Signups
                        </div>
                        <div className="tooltip-detail">
                          <span className="dot-candidate" /> {hoveredPoint.candidates} Candidates
                          <span className="dot-recruiter" style={{ marginLeft: 8 }} /> {hoveredPoint.recruiters} Recruiters
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Graph Footer Summary */}
                  <div className="admin-chart-legend-bar">
                    <div className="admin-legend-item">
                      <span className="legend-indicator total" />
                      <span>Total Signups ({totalUserCount})</span>
                    </div>
                    <div className="admin-legend-item">
                      <span className="legend-indicator candidates" />
                      <span>Candidates ({candidateCount})</span>
                    </div>
                    <div className="admin-legend-item">
                      <span className="legend-indicator recruiters" />
                      <span>Recruiters ({recruiterCount})</span>
                    </div>
                  </div>
                </div>

                {/* Role Ratio & System Breakdown Card */}
                <div className="admin-card-panel admin-donut-card">
                  <div className="admin-panel-header">
                    <div>
                      <div className="admin-panel-badge donut">
                        <PieChart size={12} />
                        Distribution
                      </div>
                      <h2 className="admin-panel-title">Platform Composition</h2>
                      <p className="admin-panel-subtitle">Candidate vs Recruiter breakdown</p>
                    </div>
                  </div>

                  {/* Circular / Donut SVG Chart */}
                  <div className="admin-donut-wrapper">
                    <svg viewBox="0 0 120 120" className="admin-donut-svg">
                      {/* Background Track */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="transparent"
                        stroke="#F1EFFC"
                        strokeWidth="12"
                      />
                      {/* Candidates Arc (Green) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="transparent"
                        stroke="#16A34A"
                        strokeWidth="12"
                        strokeDasharray={`${totalUserCount > 0 ? (candidateCount / totalUserCount) * 282.7 : 141.35} 282.7`}
                        strokeDashoffset="70.68"
                        strokeLinecap="round"
                      />
                      {/* Recruiters Arc (Amber) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="transparent"
                        stroke="#B9791A"
                        strokeWidth="12"
                        strokeDasharray={`${totalUserCount > 0 ? (recruiterCount / totalUserCount) * 282.7 : 141.35} 282.7`}
                        strokeDashoffset={`${70.68 - (totalUserCount > 0 ? (candidateCount / totalUserCount) * 282.7 : 141.35)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="admin-donut-center-text">
                      <span className="donut-center-num">{totalUserCount}</span>
                      <span className="donut-center-label">Active Users</span>
                    </div>
                  </div>

                  {/* Distribution Metric Rows */}
                  <div className="admin-donut-breakdown-list">
                    <div
                      className="admin-donut-row"
                      onClick={() => setActiveTab('candidates')}
                      style={{ cursor: 'pointer' }}
                      title="Filter Candidates"
                    >
                      <div className="admin-donut-row-left">
                        <span className="donut-color-dot candidate" />
                        <div>
                          <div className="donut-row-name">Freelancer Candidates</div>
                          <div className="donut-row-sub">Job seekers & profiles</div>
                        </div>
                      </div>
                      <div className="admin-donut-row-right">
                        <span className="donut-row-count">{candidateCount}</span>
                        <span className="donut-row-pct">
                          {totalUserCount > 0 ? Math.round((candidateCount / totalUserCount) * 100) : 50}%
                        </span>
                      </div>
                    </div>

                    <div
                      className="admin-donut-row"
                      onClick={() => setActiveTab('recruiters')}
                      style={{ cursor: 'pointer' }}
                      title="Filter Recruiters"
                    >
                      <div className="admin-donut-row-left">
                        <span className="donut-color-dot recruiter" />
                        <div>
                          <div className="donut-row-name">Employer Recruiters</div>
                          <div className="donut-row-sub">Companies hiring talent</div>
                        </div>
                      </div>
                      <div className="admin-donut-row-right">
                        <span className="donut-row-count">{recruiterCount}</span>
                        <span className="donut-row-pct">
                          {totalUserCount > 0 ? Math.round((recruiterCount / totalUserCount) * 100) : 50}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Row: Recent Data Table + Live Activity Feed */}
              <div className="admin-overview-bottom-grid">
                {/* RECENT DATA SECTION (Last 5 Signups) */}
                <div className="admin-card-panel admin-recent-signups-card">
                  <div className="admin-panel-header">
                    <div>
                      <div className="admin-panel-badge recent">
                        <UserPlus size={12} />
                        Recent Registrations
                      </div>
                      <h2 className="admin-panel-title">Latest Onboarded Users</h2>
                      <p className="admin-panel-subtitle">Newest profiles added to LucoHire</p>
                    </div>

                    <button
                      type="button"
                      className="admin-view-all-link"
                      onClick={() => setActiveTab('all')}
                    >
                      <span>View All ({totalUserCount})</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="admin-table-responsive">
                    {recentUsers.length === 0 ? (
                      <div className="admin-empty-state-compact">
                        <Users size={22} color="var(--ink-soft)" />
                        <p>No recent user registrations found.</p>
                      </div>
                    ) : (
                      <table className="admin-users-table compact">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Contact</th>
                            <th>Registered</th>
                            <th style={{ textAlign: 'center' }}>Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.map((user) => {
                            const isCandidate = user.role === 'candidate';
                            return (
                              <tr key={`recent-${user.role}-${user.id}`}>
                                <td>
                                  <div className="admin-user-cell">
                                    <div className={`admin-user-avatar ${isCandidate ? 'candidate' : 'recruiter'}`}>
                                      {(user.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="admin-user-name">{user.name || 'Unknown User'}</div>
                                      <div className="admin-user-email">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className={`admin-role-badge ${isCandidate ? 'candidate' : 'recruiter'}`}>
                                    {isCandidate ? <UserCheck size={11} /> : <Briefcase size={11} />}
                                    {isCandidate ? 'Candidate' : 'Recruiter'}
                                  </span>
                                </td>
                                <td>
                                  {user.mobile ? (
                                    <span style={{ fontSize: 12, color: 'var(--ink)' }}>{user.mobile}</span>
                                  ) : (
                                    <span style={{ color: 'var(--ink-soft)' }}>—</span>
                                  )}
                                </td>
                                <td>
                                  <span className="admin-relative-time" title={user.created_at}>
                                    <Clock size={11} />
                                    {formatRelativeTime(user.created_at)}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="admin-delete-btn"
                                    title={`Delete ${user.name}`}
                                    onClick={() => setUserToDelete(user)}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* RECENT ACTIVITY STREAM */}
                <div className="admin-card-panel admin-activity-card">
                  <div className="admin-panel-header">
                    <div>
                      <div className="admin-panel-badge activity">
                        <Activity size={12} />
                        Live Feed
                      </div>
                      <h2 className="admin-panel-title">Platform Activity</h2>
                      <p className="admin-panel-subtitle">Real-time system & user events</p>
                    </div>

                    <div className="admin-live-pulse-badge">
                      <span className="admin-live-dot" />
                      Live Stream
                    </div>
                  </div>

                  <div className="admin-activity-timeline">
                    {recentActivities.map((act) => {
                      const IconComponent = act.icon;
                      return (
                        <div className="admin-activity-item" key={act.id}>
                          <div className={`admin-activity-icon-wrap ${act.badgeClass}`}>
                            <IconComponent size={14} />
                          </div>
                          <div className="admin-activity-content">
                            <div className="admin-activity-top-row">
                              <span className="admin-activity-title">{act.title}</span>
                              <span className="admin-activity-time">{formatRelativeTime(act.time)}</span>
                            </div>
                            <div className="admin-activity-sub">{act.subtitle}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================
               VIEW 2: USER MANAGEMENT TABLE WITH FULL PAGINATION
               ======================================================== */
            <div className="admin-table-container">
              {/* Table Toolbar */}
              <div className="admin-table-toolbar">
                <div className="admin-search-box">
                  <Search size={14} className="admin-search-icon" />
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by name, email, phone, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="admin-filter-tabs">
                  <button
                    type="button"
                    className={`admin-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All ({totalUserCount})
                  </button>
                  <button
                    type="button"
                    className={`admin-tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('candidates')}
                  >
                    Candidates ({candidateCount})
                  </button>
                  <button
                    type="button"
                    className={`admin-tab-btn ${activeTab === 'recruiters' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recruiters')}
                  >
                    Recruiters ({recruiterCount})
                  </button>
                </div>

                <div className="admin-count-indicator">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              </div>

              {/* Table */}
              <div className="admin-table-responsive">
                {paginatedUsers.length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-icon">
                      <Users size={26} />
                    </div>
                    <h3>No Users Found</h3>
                    <p>
                      {searchQuery
                        ? 'No user matched your search term.'
                        : 'No users have registered under this role yet.'}
                    </p>
                  </div>
                ) : (
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Contact / Mobile</th>
                        <th>Profession / Company</th>
                        <th>Location</th>
                        <th>Registered On</th>
                        <th style={{ textAlign: 'center' }}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user) => {
                        const isCandidate = user.role === 'candidate';
                        return (
                          <tr key={`${user.role}-${user.id}`}>
                            {/* User Name & Email */}
                            <td>
                              <div className="admin-user-cell">
                                <div className={`admin-user-avatar ${isCandidate ? 'candidate' : 'recruiter'}`}>
                                  {(user.name || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="admin-user-name">{user.name || 'Unknown User'}</div>
                                  <div className="admin-user-email">{user.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td>
                              <span className={`admin-role-badge ${isCandidate ? 'candidate' : 'recruiter'}`}>
                                {isCandidate ? <UserCheck size={11} /> : <Briefcase size={11} />}
                                {isCandidate ? 'Candidate' : 'Recruiter'}
                              </span>
                            </td>

                            {/* Mobile */}
                            <td>
                              {user.mobile ? (
                                <a href={`tel:${user.mobile}`} className="admin-phone-link">
                                  <Phone size={12} />
                                  {user.mobile}
                                </a>
                              ) : (
                                <span style={{ color: 'var(--ink-soft, #75708F)' }}>—</span>
                              )}
                            </td>

                            {/* Profession / Headline or Company */}
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--ink, #1C1733)' }}>
                                {user.company || user.title || (isCandidate ? 'Freelancer' : 'Employer')}
                              </div>
                              {user.company && user.title && (
                                <div style={{ fontSize: 12, color: 'var(--ink-soft, #75708F)' }}>{user.title}</div>
                              )}
                            </td>

                            {/* Location */}
                            <td>
                              {user.city || user.state ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    color: 'var(--ink-soft, #75708F)',
                                  }}
                                >
                                  <MapPin size={12} color="var(--ink-soft, #75708F)" />
                                  {[user.city, user.state].filter(Boolean).join(', ')}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--ink-soft, #75708F)' }}>—</span>
                              )}
                            </td>

                            {/* Created Date */}
                            <td>
                              <span className="admin-date-badge">
                                <Calendar size={12} color="var(--ink-soft, #75708F)" />
                                {formatDate(user.created_at)}
                              </span>
                            </td>

                            {/* Delete Action Button */}
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="admin-delete-btn"
                                title={`Delete ${user.name || 'User'}`}
                                onClick={() => setUserToDelete(user)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* PAGINATION TOOLBAR */}
              {filteredUsers.length > 0 && (
                <div className="admin-pagination-toolbar">
                  <div className="admin-pagination-info">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                  </div>

                  <div className="admin-pagination-controls">
                    {/* Rows per page selector */}
                    <div className="admin-rows-selector">
                      <span>Rows per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="admin-pagesize-select"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                      </select>
                    </div>

                    {/* Prev Page */}
                    <button
                      type="button"
                      className="admin-page-nav-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      title="Previous Page"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    {/* Page Numbers */}
                    <div className="admin-page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`admin-page-num-btn ${currentPage === num ? 'active' : ''}`}
                          onClick={() => setCurrentPage(num)}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    {/* Next Page */}
                    <button
                      type="button"
                      className="admin-page-nav-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      title="Next Page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="admin-modal-backdrop" onClick={() => !isDeleting && setUserToDelete(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-warning-icon">
              <AlertTriangle size={24} />
            </div>
            <h3>Confirm User Deletion</h3>
            <p>
              Are you sure you want to permanently delete this user? Their account, profile, and all
              associated data will be removed from the database.
            </p>

            <div className="admin-modal-user-preview">
              <div>
                <b>Name:</b> {userToDelete.name}
              </div>
              <div>
                <b>Email:</b> {userToDelete.email}
              </div>
              <div>
                <b>Role:</b> {userToDelete.role === 'candidate' ? 'Candidate (Freelancer)' : 'Recruiter (Employer)'}
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-cancel"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-delete-confirm"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast">
          <CheckCircle2 size={17} color="#16A34A" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
