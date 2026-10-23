import React, { useState, useEffect, useMemo } from 'react';
import {
  adminGetStatus,
  adminLogin,
  adminRegister,
  adminGetStats,
  adminGetUsers,
  adminDeleteUser,
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  PlanItem,
  adminGetCareerPaths,
  adminCreateCareerPath,
  adminUpdateCareerPath,
  adminDeleteCareerPath,
  CareerPathItem,
  adminGetResumeSkills,
  adminCreateResumeSkill,
  adminUpdateResumeSkill,
  adminDeleteResumeSkill,
  ResumeSkillItem,
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
  Tag,
  Plus,
  Edit2,
  Check,
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'all' | 'candidates' | 'recruiters' | 'plans' | 'paths'>('dashboard');
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

  // Plan Management states (Freelancer and Recruiter Plans CRUD)
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);
  const [planCategoryFilter, setPlanCategoryFilter] = useState<'all' | 'freelancer' | 'recruiter'>('all');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);
  const [planToDelete, setPlanToDelete] = useState<PlanItem | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState<boolean>(false);

  const initialPlanForm = {
    name: '',
    category: 'freelancer' as 'freelancer' | 'recruiter',
    price_amount: '',
    price_unit: '/month',
    badge: '',
    description: '',
    why_text: '',
    featuresText: '',
    cta_text: '',
    is_popular: false,
    is_active: true,
    sort_order: 1,
  };
  const [planForm, setPlanForm] = useState(initialPlanForm);

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await adminGetPlans();
      if (res?.plans) {
        setPlans(res.plans);
      }
    } catch (err: any) {
      console.error('Failed to load plans:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleOpenAddPlan = (defaultCat: 'freelancer' | 'recruiter' = 'freelancer') => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      category: defaultCat,
      price_amount: defaultCat === 'freelancer' ? '₹49' : '₹1,499',
      price_unit: '/month',
      badge: '',
      description: '',
      why_text: '',
      featuresText: '',
      cta_text: '',
      is_popular: false,
      is_active: true,
      sort_order: (plans.filter(p => p.category === defaultCat).length + 1),
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: PlanItem) => {
    setEditingPlan(plan);
    const feats = Array.isArray(plan.features) ? plan.features.join('\n') : '';
    setPlanForm({
      name: plan.name || '',
      category: (plan.category as any) || 'freelancer',
      price_amount: plan.price_amount || '',
      price_unit: plan.price_unit || '/month',
      badge: plan.badge || '',
      description: plan.description || '',
      why_text: plan.why_text || '',
      featuresText: feats,
      cta_text: plan.cta_text || '',
      is_popular: Boolean(plan.is_popular),
      is_active: plan.is_active !== undefined ? Boolean(plan.is_active) : true,
      sort_order: Number(plan.sort_order) || 1,
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      showToast('Please enter a plan name.');
      return;
    }
    if (!planForm.price_amount.trim()) {
      showToast('Please enter price amount (e.g. ₹49 or ₹1,499).');
      return;
    }

    setIsSavingPlan(true);
    try {
      const featuresArray = planForm.featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        name: planForm.name.trim(),
        category: planForm.category,
        price_amount: planForm.price_amount.trim(),
        price_unit: planForm.price_unit.trim() || '/month',
        badge: planForm.badge.trim(),
        description: planForm.description.trim(),
        why_text: planForm.why_text.trim(),
        features: featuresArray,
        cta_text: planForm.cta_text.trim(),
        is_popular: planForm.is_popular,
        is_active: planForm.is_active,
        sort_order: Number(planForm.sort_order) || 1,
      };

      if (editingPlan) {
        const res = await adminUpdatePlan(editingPlan.id, payload);
        showToast(res.message || 'Plan updated successfully!');
      } else {
        const res = await adminCreatePlan(payload);
        showToast(res.message || 'Plan created successfully!');
      }

      setIsPlanModalOpen(false);
      setEditingPlan(null);
      await loadPlans();
    } catch (err: any) {
      showToast(err.message || 'Failed to save plan.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeletingPlan(true);
    try {
      await adminDeletePlan(planToDelete.id);
      showToast(`Plan "${planToDelete.name}" deleted successfully.`);
      setPlanToDelete(null);
      await loadPlans();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete plan.');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const handleTogglePlanActive = async (plan: PlanItem) => {
    try {
      await adminUpdatePlan(plan.id, { is_active: !plan.is_active });
      showToast(`Plan "${plan.name}" is now ${!plan.is_active ? 'Active' : 'Hidden'}.`);
      await loadPlans();
    } catch (err: any) {
      showToast(err.message || 'Failed to update plan status.');
    }
  };

  // Career Paths Management states (Resume Check View Path options CRUD)
  const [careerPaths, setCareerPaths] = useState<CareerPathItem[]>([]);
  const [isLoadingCareerPaths, setIsLoadingCareerPaths] = useState<boolean>(false);
  const [isCareerPathModalOpen, setIsCareerPathModalOpen] = useState<boolean>(false);
  const [editingCareerPath, setEditingCareerPath] = useState<CareerPathItem | null>(null);
  const [isSavingCareerPath, setIsSavingCareerPath] = useState<boolean>(false);
  const [careerPathToDelete, setCareerPathToDelete] = useState<CareerPathItem | null>(null);
  const [isDeletingCareerPath, setIsDeletingCareerPath] = useState<boolean>(false);

  const initialCareerPathForm = {
    custom_id: '',
    title: '',
    sub: '',
    badge: 'Fast Track',
    recommended: false,
    syllabusText: '',
    kya: '',
    one_liner: '',
    lessons: 3,
    jobs: 12000,
    is_active: true,
    sort_order: 1,
  };
  const [careerPathForm, setCareerPathForm] = useState(initialCareerPathForm);

  const loadCareerPaths = async () => {
    setIsLoadingCareerPaths(true);
    try {
      const res = await adminGetCareerPaths();
      if (res?.paths) {
        setCareerPaths(res.paths);
      }
    } catch (err: any) {
      console.error('Failed to load career paths:', err);
    } finally {
      setIsLoadingCareerPaths(false);
    }
  };

  const handleOpenAddCareerPath = () => {
    setEditingCareerPath(null);
    setCareerPathForm({
      custom_id: `p${careerPaths.length + 1}`,
      title: '',
      sub: '',
      badge: 'Fast Track',
      recommended: false,
      syllabusText: '',
      kya: '',
      one_liner: '',
      lessons: 3,
      jobs: 12000,
      is_active: true,
      sort_order: careerPaths.length + 1,
    });
    setIsCareerPathModalOpen(true);
  };

  const handleOpenEditCareerPath = (path: CareerPathItem) => {
    setEditingCareerPath(path);
    const syllabusLines = Array.isArray(path.syllabus)
      ? path.syllabus.join('\n')
      : typeof path.syllabus === 'string'
      ? (() => { try { return JSON.parse(path.syllabus).join('\n'); } catch { return path.syllabus; } })()
      : '';
    setCareerPathForm({
      custom_id: path.custom_id || path.path_key || String(path.id),
      title: path.title || '',
      sub: path.sub || '',
      badge: path.badge || '',
      recommended: Boolean(path.recommended),
      syllabusText: syllabusLines,
      kya: path.kya || '',
      one_liner: path.one_liner || '',
      lessons: Number(path.lessons) || 0,
      jobs: Number(path.jobs) || 0,
      is_active: path.is_active !== undefined ? Boolean(path.is_active) : true,
      sort_order: Number(path.sort_order) || 1,
    });
    setIsCareerPathModalOpen(true);
  };

  const handleSaveCareerPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerPathForm.title.trim()) {
      showToast('Please enter a career path title.');
      return;
    }

    setIsSavingCareerPath(true);
    try {
      const syllabusArray = careerPathForm.syllabusText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        custom_id: careerPathForm.custom_id.trim() || undefined,
        title: careerPathForm.title.trim(),
        sub: careerPathForm.sub.trim(),
        badge: careerPathForm.badge.trim(),
        recommended: careerPathForm.recommended,
        syllabus: syllabusArray,
        kya: careerPathForm.kya.trim(),
        one_liner: careerPathForm.one_liner.trim(),
        lessons: Number(careerPathForm.lessons) || 0,
        jobs: Number(careerPathForm.jobs) || 0,
        is_active: careerPathForm.is_active,
        sort_order: Number(careerPathForm.sort_order) || 1,
      };

      if (editingCareerPath) {
        const res = await adminUpdateCareerPath(editingCareerPath.id, payload);
        showToast(res.message || 'Career path updated successfully!');
      } else {
        const res = await adminCreateCareerPath(payload);
        showToast(res.message || 'Career path created successfully!');
      }

      setIsCareerPathModalOpen(false);
      setEditingCareerPath(null);
      await loadCareerPaths();
    } catch (err: any) {
      showToast(err.message || 'Failed to save career path.');
    } finally {
      setIsSavingCareerPath(false);
    }
  };

  const handleConfirmDeleteCareerPath = async () => {
    if (!careerPathToDelete) return;
    setIsDeletingCareerPath(true);
    try {
      await adminDeleteCareerPath(careerPathToDelete.id);
      showToast(`Career path "${careerPathToDelete.title}" deleted.`);
      setCareerPathToDelete(null);
      await loadCareerPaths();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete career path.');
    } finally {
      setIsDeletingCareerPath(false);
    }
  };

  const handleToggleCareerPathActive = async (path: CareerPathItem) => {
    try {
      await adminUpdateCareerPath(path.id, { is_active: !path.is_active });
      showToast(`Career path "${path.title}" is now ${!path.is_active ? 'Active' : 'Hidden'}.`);
      await loadCareerPaths();
    } catch (err: any) {
      showToast(err.message || 'Failed to update path status.');
    }
  };

  // Sub-tabs under Career & Skills Intelligence: 'paths' | 'rising' | 'keywords'
  const [resumeSubTab, setResumeSubTab] = useState<'paths' | 'rising' | 'keywords'>('paths');

  // Resume Skills & JD Keywords Management states
  const [resumeSkills, setResumeSkills] = useState<ResumeSkillItem[]>([]);
  const [isLoadingResumeSkills, setIsLoadingResumeSkills] = useState<boolean>(false);
  const [isResumeSkillModalOpen, setIsResumeSkillModalOpen] = useState<boolean>(false);
  const [editingResumeSkill, setEditingResumeSkill] = useState<ResumeSkillItem | null>(null);
  const [isSavingResumeSkill, setIsSavingResumeSkill] = useState<boolean>(false);
  const [resumeSkillToDelete, setResumeSkillToDelete] = useState<ResumeSkillItem | null>(null);
  const [isDeletingResumeSkill, setIsDeletingResumeSkill] = useState<boolean>(false);

  const initialResumeSkillForm = {
    category: 'rising' as 'rising' | 'keyword',
    skill_name: '',
    trend: '+40%',
    jobs: '6,000 jobs',
    salary: '15-20 LPA',
    learn_time: '1 day',
    note: '',
    is_active: true,
    sort_order: 1,
  };
  const [resumeSkillForm, setResumeSkillForm] = useState(initialResumeSkillForm);

  const loadResumeSkills = async () => {
    setIsLoadingResumeSkills(true);
    try {
      const res = await adminGetResumeSkills();
      if (res?.skills) {
        setResumeSkills(res.skills);
      }
    } catch (err: any) {
      console.error('Failed to load resume skills:', err);
    } finally {
      setIsLoadingResumeSkills(false);
    }
  };

  const handleOpenAddResumeSkill = (category: 'rising' | 'keyword' = 'rising') => {
    setEditingResumeSkill(null);
    setResumeSkillForm({
      category,
      skill_name: '',
      trend: category === 'rising' ? '+40%' : '+50%',
      jobs: category === 'rising' ? '5,000 jobs' : '',
      salary: category === 'rising' ? '14-20 LPA' : '',
      learn_time: '1 day',
      note: '',
      is_active: true,
      sort_order: (resumeSkills.filter((s) => s.category === category).length + 1),
    });
    setIsResumeSkillModalOpen(true);
  };

  const handleOpenEditResumeSkill = (skill: ResumeSkillItem) => {
    setEditingResumeSkill(skill);
    setResumeSkillForm({
      category: skill.category as 'rising' | 'keyword',
      skill_name: skill.skill_name || '',
      trend: skill.trend || '',
      jobs: skill.jobs || '',
      salary: skill.salary || '',
      learn_time: skill.learn_time || '1 day',
      note: skill.note || '',
      is_active: skill.is_active !== undefined ? Boolean(skill.is_active) : true,
      sort_order: Number(skill.sort_order) || 1,
    });
    setIsResumeSkillModalOpen(true);
  };

  const handleSaveResumeSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeSkillForm.skill_name.trim()) {
      showToast('Please enter a skill or keyword name.');
      return;
    }

    setIsSavingResumeSkill(true);
    try {
      const payload = {
        category: resumeSkillForm.category,
        skill_name: resumeSkillForm.skill_name.trim(),
        trend: resumeSkillForm.trend.trim(),
        jobs: resumeSkillForm.jobs.trim(),
        salary: resumeSkillForm.salary.trim(),
        learn_time: resumeSkillForm.learn_time.trim(),
        note: resumeSkillForm.note.trim(),
        is_active: resumeSkillForm.is_active,
        sort_order: Number(resumeSkillForm.sort_order) || 1,
      };

      if (editingResumeSkill) {
        const res = await adminUpdateResumeSkill(editingResumeSkill.id, payload);
        showToast(res.message || 'Updated successfully!');
      } else {
        const res = await adminCreateResumeSkill(payload);
        showToast(res.message || 'Added successfully!');
      }

      setIsResumeSkillModalOpen(false);
      setEditingResumeSkill(null);
      await loadResumeSkills();
    } catch (err: any) {
      showToast(err.message || 'Failed to save skill.');
    } finally {
      setIsSavingResumeSkill(false);
    }
  };

  const handleConfirmDeleteResumeSkill = async () => {
    if (!resumeSkillToDelete) return;
    setIsDeletingResumeSkill(true);
    try {
      await adminDeleteResumeSkill(resumeSkillToDelete.id);
      showToast(`"${resumeSkillToDelete.skill_name}" deleted.`);
      setResumeSkillToDelete(null);
      await loadResumeSkills();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete skill.');
    } finally {
      setIsDeletingResumeSkill(false);
    }
  };

  const handleToggleResumeSkillActive = async (skill: ResumeSkillItem) => {
    try {
      await adminUpdateResumeSkill(skill.id, { is_active: !skill.is_active });
      showToast(`"${skill.skill_name}" is now ${!skill.is_active ? 'Active' : 'Hidden'}.`);
      await loadResumeSkills();
    } catch (err: any) {
      showToast(err.message || 'Failed to update skill status.');
    }
  };

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

  // Fetch users, stats, and plans when authenticated
  const loadDashboardData = async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [usersRes, statsRes, plansRes, pathsRes, skillsRes] = await Promise.all([
        adminGetUsers(),
        adminGetStats().catch(() => null),
        adminGetPlans().catch(() => null),
        adminGetCareerPaths().catch(() => null),
        adminGetResumeSkills().catch(() => null),
      ]);

      if (usersRes?.users) {
        setUsers(usersRes.users);
      }
      if (plansRes?.plans) {
        setPlans(plansRes.plans);
      }
      if (pathsRes?.paths) {
        setCareerPaths(pathsRes.paths);
      }
      if (skillsRes?.skills) {
        setResumeSkills(skillsRes.skills);
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

          <div className="admin-menu-section-label" style={{ marginTop: 14 }}>Monetization</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('plans');
              setIsMobileSidebarOpen(false);
            }}
          >
            <div className="admin-nav-left">
              <span className="admin-nav-icon-badge" style={{ background: 'var(--lavender-50)', color: 'var(--violet-700)' }}>
                <Tag size={15} />
              </span>
              <span>Plans &amp; Pricing</span>
            </div>
            <span className="admin-nav-count">{plans.length}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'paths' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('paths');
              setIsMobileSidebarOpen(false);
            }}
          >
            <div className="admin-nav-left">
              <span className="admin-nav-icon-badge" style={{ background: 'var(--lavender-50)', color: 'var(--violet-700)' }}>
                <Sparkles size={15} />
              </span>
              <span>Career Paths</span>
            </div>
            <span className="admin-nav-count">{careerPaths.length}</span>
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
                : activeTab === 'plans'
                ? 'Plans & Pricing Management'
                : activeTab === 'paths'
                ? 'Career Paths Management'
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
          ) : activeTab === 'plans' ? (
            /* ========================================================
               VIEW: PLANS & PRICING MANAGEMENT (ADMIN CRUD)
               ======================================================== */
            <div className="admin-plans-container">
              {/* Top Action Card */}
              <div className="admin-plans-top-card">
                <div className="admin-plans-header-left">
                  <div className="admin-panel-badge" style={{ color: 'var(--violet-700)', background: 'var(--lavender-50)' }}>
                    <Tag size={12} />
                    Monetization &amp; Pricing
                  </div>
                  <h2>Plans &amp; Pricing Management</h2>
                  <p>Configure pricing, billing time periods (/forever, /month, /year), badges, and features for Freelancer and Recruiter / Client plans.</p>
                </div>

                <div className="admin-plans-actions-row">
                  {/* Category Filter Pills */}
                  <div className="admin-plan-cat-pills">
                    <button
                      type="button"
                      className={`admin-plan-cat-pill ${planCategoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setPlanCategoryFilter('all')}
                    >
                      All Plans ({plans.length})
                    </button>
                    <button
                      type="button"
                      className={`admin-plan-cat-pill ${planCategoryFilter === 'freelancer' ? 'active' : ''}`}
                      onClick={() => setPlanCategoryFilter('freelancer')}
                    >
                      Freelancer ({plans.filter(p => p.category === 'freelancer').length})
                    </button>
                    <button
                      type="button"
                      className={`admin-plan-cat-pill ${planCategoryFilter === 'recruiter' ? 'active' : ''}`}
                      onClick={() => setPlanCategoryFilter('recruiter')}
                    >
                      Recruiter / Client ({plans.filter(p => p.category === 'recruiter').length})
                    </button>
                  </div>

                  {/* Add Plan Button */}
                  <button
                    type="button"
                    className="admin-add-plan-btn"
                    onClick={() => handleOpenAddPlan(planCategoryFilter === 'recruiter' ? 'recruiter' : 'freelancer')}
                  >
                    <Plus size={16} />
                    <span>Add New Plan</span>
                  </button>
                </div>
              </div>

              {/* Plans Cards Grid */}
              {isLoadingPlans ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                  <div>Loading pricing plans...</div>
                </div>
              ) : (
                <div className="admin-plans-grid">
                  {plans
                    .filter(p => planCategoryFilter === 'all' || p.category === planCategoryFilter)
                    .map((p) => {
                      const feats = Array.isArray(p.features) ? p.features : [];
                      return (
                        <div key={p.id} className={`admin-plan-card ${p.is_popular ? 'popular' : ''}`}>
                          {p.badge && <span className="admin-plan-badge-tag">{p.badge}</span>}

                          <div className="admin-plan-header-row">
                            <span className={`admin-plan-cat-tag ${p.category === 'freelancer' ? 'freelancer' : 'recruiter'}`}>
                              {p.category === 'freelancer' ? 'Freelancer' : 'Recruiter / Client'}
                            </span>

                            <button
                              type="button"
                              className={`admin-plan-status-pill ${p.is_active ? 'active' : 'hidden'}`}
                              onClick={() => handleTogglePlanActive(p)}
                              title="Click to toggle Active / Hidden"
                            >
                              <span className="admin-live-dot" style={{ background: p.is_active ? '#16A34A' : '#9CA3AF' }} />
                              {p.is_active ? 'Active on Site' : 'Hidden'}
                            </button>
                          </div>

                          <h3 className="admin-plan-title">{p.name}</h3>

                          <div className="admin-plan-price-row">
                            <span className="admin-plan-price-amt">{p.price_amount}</span>
                            <span className="admin-plan-price-time">{p.price_unit}</span>
                          </div>

                          {p.description && (
                            <div className="admin-plan-desc">{p.description}</div>
                          )}

                          <div className="admin-plan-features-box">
                            <ul className="admin-plan-features-list">
                              {feats.slice(0, 5).map((f, i) => (
                                <li key={i} className="admin-plan-feature-item">
                                  <span className="admin-plan-feature-icon">✓</span>
                                  <span>{f}</span>
                                </li>
                              ))}
                              {feats.length > 5 && (
                                <li style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                                  +{feats.length - 5} more features
                                </li>
                              )}
                            </ul>
                          </div>

                          {p.why_text && (
                            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 14, fontStyle: 'italic' }}>
                              "{p.why_text.replace(/<[^>]+>/g, '')}"
                            </div>
                          )}

                          <div className="admin-plan-card-footer">
                            <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
                              CTA: {p.cta_text || 'Select'}
                            </span>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="admin-plan-action-btn"
                                onClick={() => handleOpenEditPlan(p)}
                                title="Edit Plan Details, Price &amp; Time"
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="admin-plan-action-btn delete"
                                onClick={() => setPlanToDelete(p)}
                                title="Delete Plan"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : activeTab === 'paths' ? (
            /* ========================================================
               VIEW: CAREER PATHS & RESUME SKILLS INTELLIGENCE (ADMIN CRUD)
               ======================================================== */
            <div className="admin-plans-container">
              {/* Top Action Card */}
              <div className="admin-plans-top-card">
                <div className="admin-plans-header-left">
                  <div className="admin-panel-badge" style={{ color: 'var(--violet-700)', background: 'var(--lavender-50)', borderColor: 'var(--violet-200)' }}>
                    <Sparkles size={12} />
                    Resume Journey &amp; Skills Intelligence
                  </div>
                  <h2>Career Paths &amp; Skills Intelligence</h2>
                  <p>Manage candidate career goals, trending skills on the rise, and JD match missing keywords rendered on the Resume Check page.</p>
                </div>

                <div className="admin-plans-actions-row">
                  {/* Sub-tab Switcher: Paths / Skills on the Rise / JD Missing Keywords */}
                  <div className="admin-plan-cat-pills">
                    <button
                      type="button"
                      className={`admin-plan-cat-pill ${resumeSubTab === 'paths' ? 'active' : ''}`}
                      onClick={() => setResumeSubTab('paths')}
                    >
                      Career Paths ({careerPaths.length})
                    </button>
                    <button
                      type="button"
                      className={`admin-plan-cat-pill ${resumeSubTab === 'rising' ? 'active' : ''}`}
                      onClick={() => setResumeSubTab('rising')}
                    >
                      Skills on the Rise ({resumeSkills.filter((s) => s.category === 'rising').length})
                    </button>
                    <button
                      type="button"
                      className={`admin-plan-cat-pill ${resumeSubTab === 'keywords' ? 'active' : ''}`}
                      onClick={() => setResumeSubTab('keywords')}
                    >
                      JD Missing Keywords ({resumeSkills.filter((s) => s.category === 'keyword').length})
                    </button>
                  </div>

                  {resumeSubTab === 'paths' ? (
                    <button
                      type="button"
                      className="admin-add-plan-btn"
                      onClick={handleOpenAddCareerPath}
                    >
                      <Plus size={16} />
                      <span>Add New Path</span>
                    </button>
                  ) : resumeSubTab === 'rising' ? (
                    <button
                      type="button"
                      className="admin-add-plan-btn"
                      onClick={() => handleOpenAddResumeSkill('rising')}
                    >
                      <Plus size={16} />
                      <span>Add Rising Skill</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-add-plan-btn"
                      onClick={() => handleOpenAddResumeSkill('keyword')}
                    >
                      <Plus size={16} />
                      <span>Add Missing Keyword</span>
                    </button>
                  )}
                </div>
              </div>

              {resumeSubTab === 'paths' ? (
                isLoadingCareerPaths ? (
                  <div className="admin-empty-state">
                    <RefreshCw size={28} className="animate-spin" color="var(--violet-700)" />
                    <p style={{ marginTop: 12 }}>Loading career paths...</p>
                  </div>
                ) : careerPaths.length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-icon" style={{ background: 'var(--lavender-50)', color: 'var(--violet-700)' }}>
                      <Sparkles size={26} />
                    </div>
                    <h3>No Career Paths Found</h3>
                    <p>Click "Add New Path" to create candidate career options.</p>
                  </div>
                ) : (
                  <div className="admin-plans-grid">
                    {careerPaths
                      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
                      .map((path) => {
                        const syllabusList = Array.isArray(path.syllabus)
                          ? path.syllabus
                          : typeof path.syllabus === 'string'
                          ? (() => { try { return JSON.parse(path.syllabus); } catch { return []; } })()
                          : [];

                        return (
                          <div
                            key={path.id}
                            className={`admin-plan-card ${path.recommended ? 'popular' : ''}`}
                            style={{
                              opacity: path.is_active ? 1 : 0.65,
                            }}
                          >
                            {path.badge && (
                              <div
                                className="admin-plan-badge-tag"
                                style={{ background: path.recommended ? 'var(--violet-700)' : 'var(--ink)' }}
                              >
                                {path.badge}
                              </div>
                            )}

                            <div className="admin-plan-header-row">
                              <span
                                className="admin-plan-cat-tag"
                                style={{ background: 'var(--lavender-50)', color: 'var(--violet-700)', border: '1px solid var(--violet-200)' }}
                              >
                                ID: {path.custom_id || path.path_key || String(path.id)}
                              </span>

                              <button
                                type="button"
                                className={`admin-plan-status-pill ${path.is_active ? 'active' : 'hidden'}`}
                                onClick={() => handleToggleCareerPathActive(path)}
                                title="Click to toggle Active / Hidden"
                              >
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: path.is_active ? '#16A34A' : '#9CA3AF',
                                  }}
                                />
                                {path.is_active ? 'Active' : 'Hidden'}
                              </button>
                            </div>

                            <h3 className="admin-plan-title" style={{ fontSize: 18, marginBottom: 4 }}>
                              {path.title}
                            </h3>
                            {path.sub && (
                              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '0 0 10px 0' }}>
                                {path.sub}
                              </p>
                            )}

                            {path.one_liner && (
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: 'var(--violet-700)',
                                  background: 'var(--lavender-50)',
                                  padding: '6px 10px',
                                  borderRadius: 8,
                                  marginBottom: 14,
                                  border: '1px solid var(--violet-200)',
                                }}
                              >
                                {path.one_liner}
                              </div>
                            )}

                            <div className="admin-plan-features-box" style={{ marginBottom: 14 }}>
                              <div className="admin-plan-features-label">
                                Syllabus Skills ({syllabusList.length}):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                {syllabusList.map((skill: string, idx: number) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      padding: '3px 8px',
                                      borderRadius: 6,
                                      background: '#F1F5F9',
                                      color: '#334155',
                                      border: '1px solid #E2E8F0',
                                    }}
                                  >
                                    ✓ {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {path.kya && (
                              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 14 }}>
                                <b>Outcomes:</b> {path.kya}
                              </div>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 12,
                                color: 'var(--ink-soft)',
                                fontWeight: 600,
                                marginBottom: 16,
                                paddingTop: 10,
                                borderTop: '1px dashed var(--line)',
                              }}
                            >
                              <span>📚 {path.lessons || 0} Lessons</span>
                              <span>💼 +{(Number(path.jobs) || 0).toLocaleString('en-IN')} Jobs</span>
                            </div>

                            <div className="admin-plan-card-footer" style={{ marginTop: 'auto' }}>
                              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                                Order: #{path.sort_order || 1}
                              </span>

                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="admin-plan-action-btn"
                                  onClick={() => handleOpenEditCareerPath(path)}
                                  title="Edit Career Path"
                                >
                                  <Edit2 size={13} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  className="admin-plan-action-btn delete"
                                  onClick={() => setCareerPathToDelete(path)}
                                  title="Delete Career Path"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )
              ) : resumeSubTab === 'rising' ? (
                /* VIEW: SKILLS ON THE RISE */
                isLoadingResumeSkills ? (
                  <div className="admin-empty-state">
                    <RefreshCw size={28} className="animate-spin" color="var(--violet-700)" />
                    <p style={{ marginTop: 12 }}>Loading trending skills...</p>
                  </div>
                ) : resumeSkills.filter((s) => s.category === 'rising').length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-icon" style={{ background: 'var(--lavender-50)', color: 'var(--violet-700)' }}>
                      <TrendingUp size={26} />
                    </div>
                    <h3>No Trending Skills Found</h3>
                    <p>Click "Add Rising Skill" to introduce a new industry skill.</p>
                  </div>
                ) : (
                  <div className="admin-plans-grid">
                    {resumeSkills
                      .filter((s) => s.category === 'rising')
                      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
                      .map((item) => (
                        <div
                          key={item.id}
                          className="admin-plan-card"
                          style={{ opacity: item.is_active ? 1 : 0.65 }}
                        >
                          <div className="admin-plan-header-row">
                            <span
                              className="admin-plan-cat-tag"
                              style={{ background: 'var(--lavender-50)', color: 'var(--violet-700)', border: '1px solid var(--violet-200)' }}
                            >
                              📈 Trend: {item.trend || '+0%'}
                            </span>

                            <button
                              type="button"
                              className={`admin-plan-status-pill ${item.is_active ? 'active' : 'hidden'}`}
                              onClick={() => handleToggleResumeSkillActive(item)}
                              title="Click to toggle Active / Hidden"
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: item.is_active ? '#16A34A' : '#9CA3AF',
                                }}
                              />
                              {item.is_active ? 'Active' : 'Hidden'}
                            </button>
                          </div>

                          <h3 className="admin-plan-title" style={{ fontSize: 18, marginBottom: 8 }}>
                            {item.skill_name}
                          </h3>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                            <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                              💼 <b>Jobs:</b> {item.jobs || 'N/A'}
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                              💰 <b>Salary:</b> {item.salary || 'N/A'}
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                              ⏱ <b>Learn Time:</b> {item.learn_time || '1 day'}
                            </div>
                          </div>

                          {item.note && (
                            <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic', marginBottom: 14 }}>
                              "{item.note}"
                            </div>
                          )}

                          <div className="admin-plan-card-footer" style={{ marginTop: 'auto' }}>
                            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                              Order: #{item.sort_order || 1}
                            </span>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="admin-plan-action-btn"
                                onClick={() => handleOpenEditResumeSkill(item)}
                                title="Edit Skill"
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="admin-plan-action-btn delete"
                                onClick={() => setResumeSkillToDelete(item)}
                                title="Delete Skill"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )
              ) : (
                /* VIEW: JD MATCH MISSING KEYWORDS */
                isLoadingResumeSkills ? (
                  <div className="admin-empty-state">
                    <RefreshCw size={28} className="animate-spin" color="var(--violet-700)" />
                    <p style={{ marginTop: 12 }}>Loading keywords...</p>
                  </div>
                ) : resumeSkills.filter((s) => s.category === 'keyword').length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-icon" style={{ background: 'var(--lavender-50)', color: 'var(--violet-700)' }}>
                      <Tag size={26} />
                    </div>
                    <h3>No Missing Keywords Found</h3>
                    <p>Click "Add Missing Keyword" to introduce resume target keywords.</p>
                  </div>
                ) : (
                  <div className="admin-plans-grid">
                    {resumeSkills
                      .filter((s) => s.category === 'keyword')
                      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
                      .map((item) => (
                        <div
                          key={item.id}
                          className="admin-plan-card"
                          style={{ opacity: item.is_active ? 1 : 0.65 }}
                        >
                          <div className="admin-plan-header-row">
                            <span
                              className="admin-plan-cat-tag"
                              style={{ background: 'var(--lavender-50)', color: 'var(--violet-700)', border: '1px solid var(--violet-200)' }}
                            >
                              🏷 Keyword
                            </span>

                            <button
                              type="button"
                              className={`admin-plan-status-pill ${item.is_active ? 'active' : 'hidden'}`}
                              onClick={() => handleToggleResumeSkillActive(item)}
                              title="Click to toggle Active / Hidden"
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: item.is_active ? '#16A34A' : '#9CA3AF',
                                }}
                              />
                              {item.is_active ? 'Active' : 'Hidden'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 12px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 99,
                                background: 'var(--red-tint, #FBEAE8)',
                                color: 'var(--red, #C0392B)',
                                border: '1px solid rgba(192, 57, 43, 0.2)',
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              + {item.skill_name}
                            </span>
                          </div>

                          {item.note && (
                            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 14 }}>
                              <b>Context:</b> {item.note}
                            </div>
                          )}

                          <div className="admin-plan-card-footer" style={{ marginTop: 'auto' }}>
                            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                              Order: #{item.sort_order || 1}
                            </span>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="admin-plan-action-btn"
                                onClick={() => handleOpenEditResumeSkill(item)}
                                title="Edit Keyword"
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="admin-plan-action-btn delete"
                                onClick={() => setResumeSkillToDelete(item)}
                                title="Delete Keyword"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )
              )}
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

      {/* Plan Add / Edit Modal */}
      {isPlanModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !isSavingPlan && setIsPlanModalOpen(false)}>
          <div className="admin-modal-card admin-plan-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-plan-modal-header">
              <div>
                <h3>{editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Add New Pricing Plan'}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  Set pricing amount, time period (/forever, /month, /year), badges, and feature highlights.
                </p>
              </div>
              <button
                type="button"
                className="admin-plan-modal-close"
                onClick={() => setIsPlanModalOpen(false)}
                disabled={isSavingPlan}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="admin-form-row-2col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Target Plan Category *</label>
                  <select
                    className="admin-field-input"
                    value={planForm.category}
                    onChange={(e) => setPlanForm({ ...planForm, category: e.target.value as any })}
                    style={{ background: '#FFFFFF', cursor: 'pointer' }}
                    required
                  >
                    <option value="freelancer">Freelancer Plan</option>
                    <option value="recruiter">Recruiter / Client Plan</option>
                  </select>
                </div>

                <div className="admin-field-group">
                  <label className="admin-field-label">Plan Display Name *</label>
                  <input
                    type="text"
                    className="admin-field-input"
                    placeholder="e.g. Free Starter, Pro, Premium"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Price Amount (with symbol) *</label>
                  <input
                    type="text"
                    className="admin-field-input"
                    placeholder="e.g. ₹0, ₹49, ₹1,499"
                    value={planForm.price_amount}
                    onChange={(e) => setPlanForm({ ...planForm, price_amount: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-field-group">
                  <label className="admin-field-label">Price Time / Billing Cycle *</label>
                  <input
                    type="text"
                    className="admin-field-input"
                    placeholder="e.g. /forever, /month, /year"
                    value={planForm.price_unit}
                    onChange={(e) => setPlanForm({ ...planForm, price_unit: e.target.value })}
                    required
                  />
                  <div className="admin-time-unit-pills">
                    {['/forever', '/month', '/year', '/quarter', 'one-time'].map((unit) => (
                      <span
                        key={unit}
                        className="admin-time-unit-pill"
                        onClick={() => setPlanForm({ ...planForm, price_unit: unit })}
                        title={`Set time to ${unit}`}
                      >
                        {unit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    className="admin-field-input"
                    placeholder="e.g. WORTH IT, POPULAR, RECOMMENDED"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                  />
                </div>

                <div className="admin-field-group">
                  <label className="admin-field-label">Button CTA Text</label>
                  <input
                    type="text"
                    className="admin-field-input"
                    placeholder="e.g. Upgrade — ₹1,499/month"
                    value={planForm.cta_text}
                    onChange={(e) => setPlanForm({ ...planForm, cta_text: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Short Description</label>
                <input
                  type="text"
                  className="admin-field-input"
                  placeholder="e.g. Unlimited messages &amp; AI-shortlisted candidates"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Why / Highlights Text</label>
                <input
                  type="text"
                  className="admin-field-input"
                  placeholder="e.g. Free lets you browse everyone. Premium tells you exactly who to message first."
                  value={planForm.why_text}
                  onChange={(e) => setPlanForm({ ...planForm, why_text: e.target.value })}
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Features List (1 per line)</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  placeholder={"Unlimited applications\nPriority on new matching requirements\nVerified ID badge"}
                  value={planForm.featuresText}
                  onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                />
              </div>

              <div className="admin-form-row-2col" style={{ alignItems: 'center' }}>
                <label className="admin-plan-toggle-row">
                  <input
                    type="checkbox"
                    className="admin-plan-toggle-checkbox"
                    checked={planForm.is_popular}
                    onChange={(e) => setPlanForm({ ...planForm, is_popular: e.target.checked })}
                  />
                  <span>Highlight as Featured / Popular</span>
                </label>

                <label className="admin-plan-toggle-row">
                  <input
                    type="checkbox"
                    className="admin-plan-toggle-checkbox"
                    checked={planForm.is_active}
                    onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                  />
                  <span>Active &amp; Published on Website</span>
                </label>
              </div>

              <div className="admin-modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => setIsPlanModalOpen(false)}
                  disabled={isSavingPlan}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-add-plan-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={isSavingPlan}
                >
                  {isSavingPlan ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving Plan...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Career Path Add/Edit Modal */}
      {isCareerPathModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !isSavingCareerPath && setIsCareerPathModalOpen(false)}>
          <div
            className="admin-modal-card admin-plan-form-modal"
            style={{ maxWidth: 620 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-plan-modal-header">
              <div>
                <h3>{editingCareerPath ? 'Edit Career Path' : 'Add New Career Path'}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                  Configure title, badge, syllabus skills, and outcomes for the Resume page.
                </p>
              </div>
              <button
                type="button"
                className="admin-plan-modal-close"
                onClick={() => setIsCareerPathModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCareerPath} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="admin-form-row-2col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Path Title *</label>
                  <input
                    type="text"
                    required
                    className="admin-modal-input"
                    placeholder="e.g. Abhi 3-6 LPA job chahiye"
                    value={careerPathForm.title}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, title: e.target.value })}
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Badge Tag</label>
                  <input
                    type="text"
                    className="admin-modal-input"
                    placeholder="e.g. Fast Track, Most Popular"
                    value={careerPathForm.badge}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, badge: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Subtitle / Target Timeline</label>
                  <input
                    type="text"
                    className="admin-modal-input"
                    placeholder="e.g. 0-30 din me calls badhani hai"
                    value={careerPathForm.sub}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, sub: e.target.value })}
                  />
                </div>

                <div className="admin-field-group">
                  <label className="admin-field-label">One-Liner Hook</label>
                  <input
                    type="text"
                    className="admin-modal-input"
                    placeholder="e.g. TypeScript + Next.js + Tailwind → 3x calls"
                    value={careerPathForm.one_liner}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, one_liner: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Syllabus Skills (1 per line)</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  placeholder={"TypeScript (6 hrs)\nNext.js (1 day)\nTailwind (4 hrs)"}
                  value={careerPathForm.syllabusText}
                  onChange={(e) => setCareerPathForm({ ...careerPathForm, syllabusText: e.target.value })}
                />
                <span className="admin-field-hint">Candidates can toggle these skills when building their personalized roadmap.</span>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Expected Outcomes / kya milega</label>
                <input
                  type="text"
                  className="admin-modal-input"
                  placeholder="e.g. +12,700 jobs unlock · Resume score 64→82 · Expected calls 3x"
                  value={careerPathForm.kya}
                  onChange={(e) => setCareerPathForm({ ...careerPathForm, kya: e.target.value })}
                />
              </div>

              <div className="admin-form-row-3col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Lessons Count</label>
                  <input
                    type="number"
                    min="1"
                    className="admin-modal-input"
                    value={careerPathForm.lessons}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, lessons: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Jobs Unlock Count</label>
                  <input
                    type="number"
                    min="0"
                    className="admin-modal-input"
                    value={careerPathForm.jobs}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, jobs: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    className="admin-modal-input"
                    value={careerPathForm.sort_order}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, sort_order: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="admin-form-row-2col" style={{ alignItems: 'center' }}>
                <label className="admin-plan-toggle-row">
                  <input
                    type="checkbox"
                    className="admin-plan-toggle-checkbox"
                    checked={careerPathForm.recommended}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, recommended: e.target.checked })}
                  />
                  <span>Recommend as "Matches resume"</span>
                </label>

                <label className="admin-plan-toggle-row">
                  <input
                    type="checkbox"
                    className="admin-plan-toggle-checkbox"
                    checked={careerPathForm.is_active}
                    onChange={(e) => setCareerPathForm({ ...careerPathForm, is_active: e.target.checked })}
                  />
                  <span>Active &amp; Published</span>
                </label>
              </div>

              <div className="admin-modal-actions" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => setIsCareerPathModalOpen(false)}
                  disabled={isSavingCareerPath}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-add-plan-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={isSavingCareerPath}
                >
                  {isSavingCareerPath ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving Path...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      {editingCareerPath ? 'Update Career Path' : 'Create Career Path'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Career Path Delete Confirmation Modal */}
      {careerPathToDelete && (
        <div className="admin-modal-backdrop" onClick={() => !isDeletingCareerPath && setCareerPathToDelete(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-warning-icon">
              <AlertTriangle size={24} />
            </div>
            <h3>Delete Career Path?</h3>
            <p>
              Are you sure you want to delete <b>"{careerPathToDelete.title}"</b>? It will be removed from the Resume "Choose your path" selection.
            </p>

            <div className="admin-modal-user-preview">
              <div><b>Title:</b> {careerPathToDelete.title}</div>
              <div><b>Badge:</b> {careerPathToDelete.badge || '—'}</div>
              <div><b>Lessons:</b> {careerPathToDelete.lessons} Lessons</div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-cancel"
                onClick={() => setCareerPathToDelete(null)}
                disabled={isDeletingCareerPath}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-delete-confirm"
                onClick={handleConfirmDeleteCareerPath}
                disabled={isDeletingCareerPath}
              >
                {isDeletingCareerPath ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, Delete Path
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Delete Confirmation Modal */}
      {planToDelete && (
        <div className="admin-modal-backdrop" onClick={() => !isDeletingPlan && setPlanToDelete(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-warning-icon">
              <AlertTriangle size={24} />
            </div>
            <h3>Delete Pricing Plan?</h3>
            <p>
              Are you sure you want to permanently delete <b>"{planToDelete.name}"</b>? It will no longer appear on the website pricing section.
            </p>

            <div className="admin-modal-user-preview">
              <div><b>Plan:</b> {planToDelete.name}</div>
              <div><b>Category:</b> {planToDelete.category === 'freelancer' ? 'Freelancer' : 'Recruiter / Client'}</div>
              <div><b>Price &amp; Time:</b> {planToDelete.price_amount} {planToDelete.price_unit}</div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-cancel"
                onClick={() => setPlanToDelete(null)}
                disabled={isDeletingPlan}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-delete-confirm"
                onClick={handleConfirmDeletePlan}
                disabled={isDeletingPlan}
              >
                {isDeletingPlan ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, Delete Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Skill & JD Missing Keyword Add/Edit Modal */}
      {isResumeSkillModalOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => !isSavingResumeSkill && setIsResumeSkillModalOpen(false)}
        >
          <div
            className="admin-modal-card admin-plan-form-modal"
            style={{ maxWidth: 580 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-plan-modal-header">
              <div>
                <h3>
                  {editingResumeSkill
                    ? `Edit ${resumeSkillForm.category === 'rising' ? 'Rising Skill' : 'Missing Keyword'}`
                    : `Add ${resumeSkillForm.category === 'rising' ? 'Rising Skill' : 'Missing Keyword'}`}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  This will reflect dynamically in the Resume Check View under {resumeSkillForm.category === 'rising' ? '"Skills on the rise"' : '"JD match deep-dive"'}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setIsResumeSkillModalOpen(false)}
                disabled={isSavingResumeSkill}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResumeSkill} className="admin-plan-modal-body">
              <div className="admin-form-row-2col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Category *</label>
                  <select
                    className="admin-modal-input"
                    value={resumeSkillForm.category}
                    onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, category: e.target.value as 'rising' | 'keyword' })}
                  >
                    <option value="rising">Skills on the Rise (Trending)</option>
                    <option value="keyword">JD Missing Keyword (Deep-dive)</option>
                  </select>
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Skill / Keyword Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-modal-input"
                    placeholder="e.g. Next.js 14, Figma Variables, etc."
                    value={resumeSkillForm.skill_name}
                    onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, skill_name: e.target.value })}
                  />
                </div>
              </div>

              {resumeSkillForm.category === 'rising' ? (
                <>
                  <div className="admin-form-row-3col">
                    <div className="admin-field-group">
                      <label className="admin-field-label">Growth Trend</label>
                      <input
                        type="text"
                        className="admin-modal-input"
                        placeholder="e.g. +40%"
                        value={resumeSkillForm.trend}
                        onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, trend: e.target.value })}
                      />
                    </div>
                    <div className="admin-field-group">
                      <label className="admin-field-label">Jobs Unlocked</label>
                      <input
                        type="text"
                        className="admin-modal-input"
                        placeholder="e.g. 6,000 jobs"
                        value={resumeSkillForm.jobs}
                        onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, jobs: e.target.value })}
                      />
                    </div>
                    <div className="admin-field-group">
                      <label className="admin-field-label">Salary Bracket</label>
                      <input
                        type="text"
                        className="admin-modal-input"
                        placeholder="e.g. 15-20 LPA"
                        value={resumeSkillForm.salary}
                        onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, salary: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="admin-form-row-2col">
                    <div className="admin-field-group">
                      <label className="admin-field-label">Learn Time</label>
                      <input
                        type="text"
                        className="admin-modal-input"
                        placeholder="e.g. 1 day, 3 days"
                        value={resumeSkillForm.learn_time}
                        onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, learn_time: e.target.value })}
                      />
                    </div>
                    <div className="admin-field-group">
                      <label className="admin-field-label">Sort Order</label>
                      <input
                        type="number"
                        min="1"
                        className="admin-modal-input"
                        value={resumeSkillForm.sort_order}
                        onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, sort_order: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-form-row-2col">
                  <div className="admin-field-group">
                    <label className="admin-field-label">Importance / Impact Badge</label>
                    <input
                      type="text"
                      className="admin-modal-input"
                      placeholder="e.g. +50% ATS or High Impact"
                      value={resumeSkillForm.trend}
                      onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, trend: e.target.value })}
                    />
                  </div>
                  <div className="admin-field-group">
                    <label className="admin-field-label">Sort Order</label>
                    <input
                      type="number"
                      min="1"
                      className="admin-modal-input"
                      value={resumeSkillForm.sort_order}
                      onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, sort_order: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              )}

              <div className="admin-field-group">
                <label className="admin-field-label">Short Note / Description</label>
                <input
                  type="text"
                  className="admin-modal-input"
                  placeholder="e.g. Recommended for modern front-end roles"
                  value={resumeSkillForm.note}
                  onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, note: e.target.value })}
                />
              </div>

              <div className="admin-form-row-2col" style={{ alignItems: 'center' }}>
                <label className="admin-plan-toggle-row">
                  <input
                    type="checkbox"
                    className="admin-plan-toggle-checkbox"
                    checked={resumeSkillForm.is_active}
                    onChange={(e) => setResumeSkillForm({ ...resumeSkillForm, is_active: e.target.checked })}
                  />
                  <span>Active &amp; Visible on Resume Check Page</span>
                </label>
              </div>

              <div className="admin-modal-actions" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => setIsResumeSkillModalOpen(false)}
                  disabled={isSavingResumeSkill}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-add-plan-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={isSavingResumeSkill}
                >
                  {isSavingResumeSkill ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      {editingResumeSkill ? 'Update Item' : 'Add to Resume Check'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Skill Delete Confirmation Modal */}
      {resumeSkillToDelete && (
        <div
          className="admin-modal-backdrop"
          onClick={() => !isDeletingResumeSkill && setResumeSkillToDelete(null)}
        >
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-warning-icon">
              <AlertTriangle size={24} />
            </div>
            <h3>
              Delete {resumeSkillToDelete.category === 'rising' ? 'Rising Skill' : 'Missing Keyword'}?
            </h3>
            <p>
              Are you sure you want to delete <b>"{resumeSkillToDelete.skill_name}"</b>? It will no longer show in the Resume Check View.
            </p>

            <div className="admin-modal-user-preview">
              <div><b>Name:</b> {resumeSkillToDelete.skill_name}</div>
              <div><b>Category:</b> {resumeSkillToDelete.category === 'rising' ? 'Skills on the Rise' : 'JD Missing Keyword'}</div>
              <div><b>Trend / Badge:</b> {resumeSkillToDelete.trend || '—'}</div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-cancel"
                onClick={() => setResumeSkillToDelete(null)}
                disabled={isDeletingResumeSkill}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-delete-confirm"
                onClick={handleConfirmDeleteResumeSkill}
                disabled={isDeletingResumeSkill}
              >
                {isDeletingResumeSkill ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, Delete Item
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
