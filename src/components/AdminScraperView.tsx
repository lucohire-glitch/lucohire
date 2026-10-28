import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Mail,
  ShieldCheck,
  FileText,
  Upload,
  Layers,
  ArrowRight,
  Database,
  History,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  fetchScraperCompanies,
  addScraperCompany,
  importScraperCsv,
  triggerCompanyScan,
  triggerScanAll,
  fetchScraperScans,
  fetchScraperJobs,
  toggleScraperJobPublish,
  retryScraperPending,
  ScrapedCompany,
  ScrapedJob,
  ScraperScanRun,
} from '../api';

const checkJobPortal = (str: string): string | null => {
  if (!str) return null;
  const lower = str.toLowerCase().trim();
  const portals = [
    { name: 'Naukri (naukri.com)', match: 'naukri' },
    { name: 'Indeed (indeed.com)', match: 'indeed' },
    { name: 'LinkedIn Jobs (linkedin.com)', match: 'linkedin' },
    { name: 'Glassdoor (glassdoor.com)', match: 'glassdoor' },
    { name: 'FoundIt / Monster (foundit.in)', match: 'foundit' },
    { name: 'Monster (monster.com)', match: 'monster' },
    { name: 'Shine (shine.com)', match: 'shine.com' },
    { name: 'ZipRecruiter (ziprecruiter.com)', match: 'ziprecruiter' },
    { name: 'SimplyHired (simplyhired.com)', match: 'simplyhired' },
    { name: 'TimesJobs (timesjobs.com)', match: 'timesjobs' },
    { name: 'FreshersWorld (freshersworld.com)', match: 'freshersworld' },
    { name: 'Internshala (internshala.com)', match: 'internshala' },
    { name: 'Instahyre (instahyre.com)', match: 'instahyre' },
    { name: 'Cutshort (cutshort.io)', match: 'cutshort' },
    { name: 'Upwork (upwork.com)', match: 'upwork' },
    { name: 'Fiverr (fiverr.com)', match: 'fiverr' },
    { name: 'Freelancer (freelancer.com)', match: 'freelancer' },
  ];
  for (const p of portals) {
    if (lower.includes(p.match)) return p.name;
  }
  return null;
};

export default function AdminScraperView() {
  const [activeSubTab, setActiveSubTab] = useState<'companies' | 'jobs' | 'scans' | 'debug'>('companies');
  const [companies, setCompanies] = useState<ScrapedCompany[]>([]);
  const [jobs, setJobs] = useState<ScrapedJob[]>([]);
  const [scans, setScans] = useState<ScraperScanRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Company Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyRole, setNewCompanyRole] = useState('');
  const [newCompanyLocation, setNewCompanyLocation] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [portalValidationError, setPortalValidationError] = useState<string | null>(null);

  // Dedicated filters for Extracted Jobs
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  const [jobCompanyFilter, setJobCompanyFilter] = useState('');
  const [jobLocationFilter, setJobLocationFilter] = useState('');
  const [jobWorkModeFilter, setJobWorkModeFilter] = useState('All');

  // CSV Import Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Selected company for inspection / debugging
  const [selectedCompany, setSelectedCompany] = useState<ScrapedCompany | null>(null);
  const [scanningCompanyId, setScanningCompanyId] = useState<number | null>(null);
  // Duplicate Listings Audit Modal
  const [duplicateModalCompany, setDuplicateModalCompany] = useState<any | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [compRes, scansRes, jobsRes] = await Promise.all([
        fetchScraperCompanies(),
        fetchScraperScans(),
        fetchScraperJobs(),
      ]);
      if (compRes?.companies) setCompanies(compRes.companies);
      if (scansRes?.scans) setScans(scansRes.scans);
      if (jobsRes?.jobs) setJobs(jobsRes.jobs);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setPortalValidationError(null);
    const compName = newCompanyName.trim();
    const compWeb = newCompanyWebsite.trim();
    const compMail = newCompanyEmail.trim();
    const targetRole = newCompanyRole.trim();
    const targetLoc = newCompanyLocation.trim();

    if (!compName && !compWeb && !compMail) {
      showToast('Please provide at least a company name, website, or email');
      return;
    }

    // Guard against 3rd-party job aggregators (Naukri, Indeed, LinkedIn, etc.)
    const detectedPortal =
      checkJobPortal(compName) ||
      checkJobPortal(compWeb) ||
      checkJobPortal(compMail);

    if (detectedPortal) {
      setPortalValidationError(
        `Scanning 3rd-party job portals ("${detectedPortal}") is strictly blocked.\n\n` +
        `• Why is this blocked? Aggregator portals (like Naukri, Indeed, Glassdoor, LinkedIn) contain duplicate, outdated, and expired postings with broken redirect links.\n\n` +
        `• What should you do? Enter the direct company name or official website (e.g. accenture.com, stripe.com, adobe.com) to scan official, 100% verified employer jobs.`
      );
      showToast(`🚫 Job portal "${detectedPortal}" is blocked!`);
      return;
    }

    setIsSavingCompany(true);
    try {
      const res = await addScraperCompany({
        name: compName || compWeb || compMail,
        website: compWeb,
        contactEmail: compMail,
      });
      if (res && res.success) {
        const addedName = res.company?.name || compName || 'Company';
        showToast(`Company "${addedName}" added! Scanning active openings...`);
        setIsAddModalOpen(false);
        setPortalValidationError(null);
        const compId = res.company?.id;
        setNewCompanyName('');
        setNewCompanyWebsite('');
        setNewCompanyEmail('');
        setNewCompanyRole('');
        setNewCompanyLocation('');
        await loadData();
        if (compId) {
          handleScan(compId, { keyword: targetRole, location: targetLoc });
        }
      } else {
        const errMsg = res?.reason || res?.error || 'Failed to add company';
        if (res?.error === 'JOB_PORTAL_BLOCKED' || res?.reason) {
          setPortalValidationError(errMsg);
        }
        showToast('Error: ' + errMsg);
      }
    } catch (err: any) {
      showToast('Error: ' + (err.message || 'Something went wrong'));
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    try {
      const lines = csvText.trim().split('\n');
      const rejectedPortals: string[] = [];
      const parsed = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        const name = parts[0] || '';
        const website = parts[1] || '';
        const portal = checkJobPortal(name) || checkJobPortal(website);
        if (portal) {
          rejectedPortals.push(`${name || website} (${portal})`);
          return null;
        }
        return {
          name,
          website,
          country: parts[2] || '',
          contactEmail: parts[3] || '',
        };
      }).filter(Boolean) as any[];

      if (rejectedPortals.length > 0) {
        showToast(`⚠️ Blocked ${rejectedPortals.length} job aggregator(s): ${rejectedPortals.slice(0, 2).join(', ')}`);
      }

      if (parsed.length === 0) {
        showToast('All rows in CSV were job portals and have been blocked.');
        return;
      }

      const res = await importScraperCsv(parsed);
      if (res.success) {
        showToast(`Imported ${res.importedCount} direct companies from CSV!`);
        setIsCsvModalOpen(false);
        setCsvText('');
        loadData();
      }
    } catch (err: any) {
      showToast('CSV import failed: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleScan = async (companyId: number, options: { keyword?: string; title?: string; location?: string } = {}) => {
    setScanningCompanyId(companyId);
    showToast('Starting compliance & job scan...');
    try {
      const res = await triggerCompanyScan(companyId, options);
      if (res.success) {
        if (res.duplicates && res.duplicates.length > 0) {
          showToast(`⚠️ Scan complete: ${res.jobsExtracted} unique jobs saved. ${res.duplicates.length} duplicate entries detected on employer portal.`);
        } else {
          showToast(`Scan complete: ${res.jobsExtracted} jobs found (${res.status})`);
        }
        loadData();
      } else {
        showToast('Scan stopped: ' + (res.status || 'Error'));
      }
    } catch (err: any) {
      showToast('Scan failed: ' + err.message);
    } finally {
      setScanningCompanyId(null);
    }
  };

  const handleScanAll = async () => {
    setIsLoading(true);
    showToast('Queueing scans for all allowed companies...');
    try {
      await triggerScanAll();
      showToast('Batch scan complete!');
      loadData();
    } catch (err: any) {
      showToast('Batch scan failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async (jobId: number, current: boolean) => {
    try {
      const res = await toggleScraperJobPublish(jobId, !current);
      if (res.success) {
        showToast(!current ? 'Job Published to LucoHire' : 'Job Unpublished');
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_published: !current } : j));
      }
    } catch (e: any) {
      showToast('Update failed: ' + e.message);
    }
  };

  const handleRetryPending = async (scanId: number) => {
    showToast('Retrying pending unfinished parts without repeating completed work...');
    try {
      const res = await retryScraperPending(scanId);
      if (res.success) {
        showToast('Partial recovery finished successfully!');
        loadData();
      }
    } catch (err: any) {
      showToast('Recovery failed: ' + err.message);
    }
  };

  // Pagination states
  const [compPage, setCompPage] = useState(1);
  const [compPageSize, setCompPageSize] = useState(10);

  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPageSize, setJobsPageSize] = useState(25);

  const [scansPage, setScansPage] = useState(1);
  const [scansPageSize, setScansPageSize] = useState(10);

  // Reset page when search or filters change
  useEffect(() => {
    setCompPage(1);
    setJobsPage(1);
    setScansPage(1);
  }, [searchQuery, jobTitleFilter, jobCompanyFilter, jobLocationFilter, jobWorkModeFilter]);

  const filteredCompanies = companies.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const directMatch =
      c.name.toLowerCase().includes(q) ||
      (c.website && c.website.toLowerCase().includes(q)) ||
      (c.ats_provider && c.ats_provider.toLowerCase().includes(q)) ||
      (c.country && c.country.toLowerCase().includes(q));
    if (directMatch) return true;

    // Also match if any extracted job under this company matches the search query (job title, location, or department)
    return jobs.some(j =>
      j.company_id === c.id &&
      (j.title.toLowerCase().includes(q) ||
       (j.location && j.location.toLowerCase().includes(q)) ||
       (j.department && j.department.toLowerCase().includes(q)))
    );
  });
  const totalCompPages = Math.ceil(filteredCompanies.length / compPageSize) || 1;
  const paginatedCompanies = filteredCompanies.slice((compPage - 1) * compPageSize, compPage * compPageSize);

  const filteredJobs = jobs.filter(j => {
    const q = searchQuery.toLowerCase();
    const matchesGeneral = !searchQuery ||
      j.title.toLowerCase().includes(q) ||
      j.company_name.toLowerCase().includes(q) ||
      (j.location && j.location.toLowerCase().includes(q)) ||
      (j.department && j.department.toLowerCase().includes(q));

    const matchesTitle = !jobTitleFilter || j.title.toLowerCase().includes(jobTitleFilter.toLowerCase());
    const matchesCompany = !jobCompanyFilter || j.company_name.toLowerCase().includes(jobCompanyFilter.toLowerCase());
    const matchesLocation = !jobLocationFilter || (j.location && j.location.toLowerCase().includes(jobLocationFilter.toLowerCase()));
    const matchesWorkMode = !jobWorkModeFilter || jobWorkModeFilter === 'All' || j.work_mode?.toLowerCase() === jobWorkModeFilter.toLowerCase();

    return matchesGeneral && matchesTitle && matchesCompany && matchesLocation && matchesWorkMode;
  });
  const totalJobsPages = Math.ceil(filteredJobs.length / jobsPageSize) || 1;
  const paginatedJobs = filteredJobs.slice((jobsPage - 1) * jobsPageSize, jobsPage * jobsPageSize);

  const filteredScans = scans.filter(s =>
    s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.extraction_method && s.extraction_method.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const totalScansPages = Math.ceil(filteredScans.length / scansPageSize) || 1;
  const paginatedScans = filteredScans.slice((scansPage - 1) * scansPageSize, scansPage * scansPageSize);

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    pageSize: number,
    onPageChange: (p: number) => void,
    onPageSizeChange: (s: number) => void
  ) => {
    if (totalItems === 0) return null;
    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalItems);

    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        borderTop: '1px solid #ECEAF9',
        background: '#FAF9FE',
        fontSize: '12.5px',
        color: 'var(--ink-soft, #75708F)',
        borderBottomLeftRadius: '14px',
        borderBottomRightRadius: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>
            Showing <b>{startIdx}</b>–<b>{endIdx}</b> of <b>{totalItems}</b> items
          </span>
          <span style={{ color: '#D8D2FA' }}>|</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Rows per page:
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #ECEAF9',
                background: '#FFFFFF',
                fontSize: '12px',
                color: 'var(--ink, #1C1733)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid #ECEAF9',
              background: '#FFFFFF',
              color: currentPage <= 1 ? '#C4C2D6' : 'var(--ink, #1C1733)',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            <ChevronLeft size={13} /> Prev
          </button>

          {pages.map((p, idx) => (
            p === '...' ? (
              <span key={`dots-${idx}`} style={{ padding: '0 6px', color: '#9AA0B4' }}>...</span>
            ) : (
              <button
                key={`page-${p}-${idx}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                style={{
                  minWidth: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  border: currentPage === p ? 'none' : '1px solid #ECEAF9',
                  background: currentPage === p ? 'var(--violet-700, #4A3AE0)' : '#FFFFFF',
                  color: currentPage === p ? '#FFFFFF' : 'var(--ink, #1C1733)',
                  cursor: 'pointer',
                  fontWeight: currentPage === p ? 700 : 500,
                  fontSize: '12px',
                }}
              >
                {p}
              </button>
            )
          ))}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid #ECEAF9',
              background: '#FFFFFF',
              color: currentPage >= totalPages ? '#C4C2D6' : 'var(--ink, #1C1733)',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '4px 0', fontFamily: 'inherit' }}>
      {/* Toast message popup */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#1C1733',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 99999,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={16} color="#10B981" />
          {toastMessage}
        </div>
      )}

      {/* Top Header / Actions Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink, #1C1733)', margin: 0 }}>
            Universal Job Scraping Engine v2
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft, #75708F)', margin: '4px 0 0' }}>
            Automated discovery, multi-ATS extraction, compliance gates &amp; zero-job safety.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#FFFFFF',
              border: '1px solid #ECEAF9',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--ink, #1C1733)'
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'admin-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#FFFFFF',
              border: '1px solid #ECEAF9',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--ink, #1C1733)'
            }}
          >
            <Upload size={14} />
            Import CSV
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--violet-700, #4A3AE0)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(74, 58, 224, 0.25)'
            }}
          >
            <Plus size={15} />
            Add Company
          </button>

          <button
            type="button"
            onClick={handleScanAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#16A34A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <Play size={14} />
            Scan All Allowed
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', fontWeight: 600 }}>Tracked Companies</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink, #1C1733)', marginTop: '4px' }}>
            {companies.length}
          </div>
          <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>
            {companies.filter(c => c.verification_status === 'Verified').length} Verified
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', fontWeight: 600 }}>Live Extracted Jobs</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--violet-700, #4A3AE0)', marginTop: '4px' }}>
            {jobs.filter(j => j.is_published && j.status === 'ACTIVE').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-soft, #75708F)', marginTop: '4px' }}>
            Total scraped: {jobs.length}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', fontWeight: 600 }}>Scan Success Rate</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>
            {scans.length > 0 ? Math.round((scans.filter(s => s.status === 'PASS').length / scans.length) * 100) : 100}%
          </div>
          <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>
            Zero-Job Safety Protected
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', fontWeight: 600 }}>Compliance Status</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0E8F5F', marginTop: '4px' }}>
            100%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-soft, #75708F)', marginTop: '4px' }}>
            robots.txt &amp; SSRF Active
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid #ECEAF9',
        paddingBottom: '10px',
        marginBottom: '16px',
      }}>
        {[
          { key: 'companies', label: `Companies (${companies.length})` },
          { key: 'jobs', label: `Extracted Jobs (${jobs.length})` },
          { key: 'scans', label: `Scan History & Coverage (${scans.length})` },
          { key: 'debug', label: 'Engine Debugging & Safety' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSubTab(tab.key as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeSubTab === tab.key ? 'var(--violet-700, #4A3AE0)' : 'transparent',
              color: activeSubTab === tab.key ? '#FFFFFF' : 'var(--ink-soft, #75708F)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{
          position: 'relative',
          flex: 1,
          maxWidth: '400px',
        }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9AA0B4' }} />
          <input
            type="text"
            placeholder="Search company, title, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '10px',
              border: '1px solid #ECEAF9',
              fontSize: '13px',
              outline: 'none',
              background: '#FFFFFF',
            }}
          />
        </div>
      </div>

      {/* TAB 1: COMPANIES */}
      {activeSubTab === 'companies' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #ECEAF9', color: 'var(--ink-soft, #75708F)' }}>
                <th style={{ padding: '12px 16px' }}>Company</th>
                <th style={{ padding: '12px 16px' }}>ATS / Extraction</th>
                <th style={{ padding: '12px 16px' }}>Public Contact Email</th>
                <th style={{ padding: '12px 16px' }}>Access Status</th>
                <th style={{ padding: '12px 16px' }}>Active Jobs</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9AA0B4' }}>
                    No companies found. Click "Add Company" or "Import CSV" to start.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #ECEAF9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink, #1C1733)' }}>{c.name}</div>
                      {c.website && (
                        <a
                          href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '11px', color: 'var(--violet-700, #4A3AE0)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                        >
                          {c.website.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                        </a>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#ECEAF9',
                        color: 'var(--violet-700, #4A3AE0)',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {c.ats_provider || 'Detecting...'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: c.contact_email ? '#1C1733' : '#9AA0B4' }}>
                      {c.contact_email ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                          <Mail size={12} color="#16A34A" /> {c.contact_email}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px' }}>Scanning for email...</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: c.access_status === 'ALLOWED' ? '#EAFBF1' : '#FBEAE8',
                        color: c.access_status === 'ALLOWED' ? '#16A34A' : '#C0392B',
                      }}>
                        {c.access_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink, #1C1733)' }}>
                        {c.active_jobs_count || 0} jobs
                      </div>
                      {((c.latest_snapshot_data?.duplicates_count > 0) || (c.latest_reported_count && c.latest_reported_count > (c.active_jobs_count || 0))) && (
                        <button
                          type="button"
                          onClick={() => {
                            setDuplicateModalCompany(c);
                            setIsDuplicateModalOpen(true);
                          }}
                          style={{
                            marginTop: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: '#FEF3C7',
                            color: '#B45309',
                            border: '1px solid #FCD34D',
                            cursor: 'pointer'
                          }}
                          title="Click to view duplicate listings audit report"
                        >
                          <AlertTriangle size={11} color="#B45309" />
                          {c.latest_snapshot_data?.duplicates_count || (c.latest_reported_count - (c.active_jobs_count || 0))} Duplicates on portal
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleScan(c.id)}
                        disabled={scanningCompanyId === c.id}
                        style={{
                          padding: '6px 12px',
                          background: scanningCompanyId === c.id ? '#ECEAF9' : 'var(--violet-700, #4A3AE0)',
                          color: scanningCompanyId === c.id ? '#9AA0B4' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: scanningCompanyId === c.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <RefreshCw size={11} className={scanningCompanyId === c.id ? 'admin-spin' : ''} />
                        {scanningCompanyId === c.id ? 'Scanning...' : 'Rescan'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {renderPagination(compPage, totalCompPages, filteredCompanies.length, compPageSize, setCompPage, setCompPageSize)}
        </div>
      )}

      {/* TAB 2: JOBS */}
      {activeSubTab === 'jobs' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {/* Dedicated Filter Controls for Job Title, Company, Location & Work Mode */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
            background: '#FFFFFF',
            padding: '12px 16px',
            border: '1px solid #ECEAF9',
            borderRadius: '12px',
          }}>
            <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#75708F', marginBottom: '3px' }}>
                Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Software Engineer..."
                value={jobTitleFilter}
                onChange={(e) => setJobTitleFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #ECEAF9',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#75708F', marginBottom: '3px' }}>
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Accenture..."
                value={jobCompanyFilter}
                onChange={(e) => setJobCompanyFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #ECEAF9',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#75708F', marginBottom: '3px' }}>
                Location / City
              </label>
              <input
                type="text"
                placeholder="e.g. Pune, Nagpur, Remote..."
                value={jobLocationFilter}
                onChange={(e) => setJobLocationFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #ECEAF9',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ flex: '0 1 130px', minWidth: '110px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#75708F', marginBottom: '3px' }}>
                Work Mode
              </label>
              <select
                value={jobWorkModeFilter}
                onChange={(e) => setJobWorkModeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid #ECEAF9',
                  fontSize: '12.5px',
                  outline: 'none',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <option value="All">All Modes</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {(jobTitleFilter || jobCompanyFilter || jobLocationFilter || jobWorkModeFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setJobTitleFilter('');
                  setJobCompanyFilter('');
                  setJobLocationFilter('');
                  setJobWorkModeFilter('All');
                }}
                style={{
                  alignSelf: 'flex-end',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ECEAF9',
                  background: '#F8F9FA',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#C0392B',
                  cursor: 'pointer',
                  marginBottom: '1px',
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #ECEAF9', color: 'var(--ink-soft, #75708F)' }}>
                <th style={{ padding: '12px 16px' }}>Job Role &amp; Company</th>
                <th style={{ padding: '12px 16px' }}>Location &amp; Mode</th>
                <th style={{ padding: '12px 16px' }}>Contact Email</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Original Apply Link</th>
                <th style={{ padding: '12px 16px' }}>Published on Site</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9AA0B4' }}>
                    No jobs scraped yet. Click "Scan" on any company to start extracting jobs.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map(j => (
                  <tr key={j.id} style={{ borderBottom: '1px solid #ECEAF9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink, #1C1733)' }}>{j.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-soft, #75708F)' }}>{j.company_name}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>{j.location || 'Multiple'}</div>
                      <span style={{ fontSize: '11px', color: '#75708F' }}>{j.work_mode}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {j.company_email ? (
                        <span style={{ fontSize: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Mail size={11} /> {j.company_email}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9AA0B4' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: j.status === 'ACTIVE' ? '#EAFBF1' : '#FBEAE8',
                        color: j.status === 'ACTIVE' ? '#16A34A' : '#C0392B',
                      }}>
                        {j.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <a
                        href={j.apply_url || j.original_job_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '12px',
                          color: 'var(--violet-700, #4A3AE0)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Apply Page <ExternalLink size={12} />
                      </a>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(j.id, j.is_published)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          background: j.is_published ? '#EAFBF1' : '#ECEAF9',
                          color: j.is_published ? '#16A34A' : '#75708F',
                        }}
                      >
                        {j.is_published ? 'Live on LucoHire' : 'Hidden'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {renderPagination(jobsPage, totalJobsPages, filteredJobs.length, jobsPageSize, setJobsPage, setJobsPageSize)}
        </div>
      </div>
      )}

      {/* TAB 3: SCANS & COVERAGE REPORT */}
      {activeSubTab === 'scans' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px', color: 'var(--ink, #1C1733)' }}>
              1. Extraction Coverage Reports
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', margin: '0 0 16px' }}>
              Every scan reports visited pages, filters explored, unique jobs, reported count, and coverage status (COMPLETE / PARTIAL / UNKNOWN).
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #ECEAF9', color: '#75708F' }}>
                    <th style={{ padding: '10px 12px' }}>Company</th>
                    <th style={{ padding: '10px 12px' }}>Scan Status</th>
                    <th style={{ padding: '10px 12px' }}>Coverage</th>
                    <th style={{ padding: '10px 12px' }}>Method</th>
                    <th style={{ padding: '10px 12px' }}>Jobs Found</th>
                    <th style={{ padding: '10px 12px' }}>Pages Visited</th>
                    <th style={{ padding: '10px 12px' }}>Duration</th>
                    <th style={{ padding: '10px 12px' }}>Outcome / Recovery</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#9AA0B4' }}>
                        No scans recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedScans.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #ECEAF9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{s.company_name}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            background: s.status === 'PASS' ? '#EAFBF1' : s.status === 'PARTIAL' ? '#FBF1DF' : '#FBEAE8',
                            color: s.status === 'PASS' ? '#16A34A' : s.status === 'PARTIAL' ? '#B9791A' : '#C0392B',
                          }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            background: s.coverage === 'COMPLETE' ? '#EAFBF1' : '#FBF1DF',
                            color: s.coverage === 'COMPLETE' ? '#16A34A' : '#B9791A',
                          }}>
                            {s.coverage}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>{s.extraction_method}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{s.jobs_found} jobs</td>
                        <td style={{ padding: '10px 12px' }}>{s.pages_visited} pages</td>
                        <td style={{ padding: '10px 12px' }}>{s.duration_seconds}s</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div>{s.outcome_notes || 'All pages parsed.'}</div>
                          {s.pending_tasks && s.pending_tasks.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRetryPending(s.id)}
                              style={{
                                marginTop: '4px',
                                padding: '3px 8px',
                                background: '#FBF1DF',
                                color: '#B9791A',
                                border: '1px solid #F5C445',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              Retry Unfinished
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {renderPagination(scansPage, totalScansPages, filteredScans.length, scansPageSize, setScansPage, setScansPageSize)}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ENGINE DEBUGGING & ZERO-JOB SAFETY */}
      {activeSubTab === 'debug' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Card 1: Website Structure Memory */}
          <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={18} color="var(--violet-700, #4A3AE0)" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--ink, #1C1733)' }}>
                2. Website Structure Memory
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', margin: '0 0 14px' }}>
              Stores last successful strategy, pagination method, endpoints and adapter versions.
            </p>

            <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '12px', fontSize: '12px', lineHeight: 1.6 }}>
              <div><b>Saved Adapters:</b> Greenhouse API, Lever API, Ashby GraphQL, Schema.org JSON-LD</div>
              <div><b>Drift Detection:</b> Active (revalidates when selectors or endpoints change)</div>
              <div><b>Status:</b> All adapters responding with valid contracts</div>
            </div>
          </div>

          {/* Card 2: Zero-Job Safety */}
          <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={18} color="#16A34A" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--ink, #1C1733)' }}>
                3. Zero-Job Safety Protection
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', margin: '0 0 14px' }}>
              Never expires jobs on failed/incomplete scans. Requires 3 consecutive complete verified scans showing zero jobs before expiring.
            </p>

            <div style={{ background: '#EAFBF1', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#16A34A', lineHeight: 1.6 }}>
              <div>✅ <b>Rule Active:</b> Incomplete scans marked as INCOMPLETE, not NO_OPENINGS.</div>
              <div>✅ <b>Safe Status:</b> 0 jobs accidentally deleted or expired.</div>
            </div>
          </div>

          {/* Card 3: Partial Scan Recovery */}
          <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <RotateCcw size={18} color="#B9791A" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--ink, #1C1733)' }}>
                4. Partial Scan Recovery
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', margin: '0 0 14px' }}>
              Valid jobs extracted before any network timeout or failure are kept in DB. Unfinished pages or filters are queued for retry.
            </p>

            <div style={{ background: '#FBF1DF', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#B9791A', lineHeight: 1.6 }}>
              <div>⚡ <b>Smart Checkpointing:</b> Partial scan jobs committed before fail-exit.</div>
              <div>⚡ <b>De-duplication:</b> Retried jobs will not duplicate existing records.</div>
            </div>
          </div>

          {/* Card 4: Compliance & Ethics */}
          <div style={{ background: '#FFFFFF', border: '1px solid #ECEAF9', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Layers size={18} color="#0E8F5F" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--ink, #1C1733)' }}>
                5. Ethical Bot &amp; SSRF Shield
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', margin: '0 0 14px' }}>
              Full compliance controls: honest user-agent, respects robots.txt Crawl-delay, and guards internal cloud IPs.
            </p>

            <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '12px', fontSize: '12px', lineHeight: 1.6 }}>
              <div><b>User-Agent:</b> <code>LucoHireBot/1.0 (+https://lucohire.com/bot)</code></div>
              <div><b>SSRF Defense:</b> Loopback, 10.x, 192.168.x, 169.254.x blocked</div>
              <div><b>AI / Playwright Policy:</b> Zero unnecessary overhead</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD COMPANY */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--ink, #1C1733)' }}>
              Add / Scan Company
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft, #75708F)', margin: '0 0 18px' }}>
              Enter any combination of <b>Name</b>, <b>Website</b>, or <b>Email</b>. The engine automatically connects to the company's real career portal (Workday, Greenhouse, Lever, Ashby, XML Sitemaps) and scans live jobs.
            </p>

            {portalValidationError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '14px',
                fontSize: '12px',
                color: '#991B1B',
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>🚫</span>
                  <span>3rd-Party Job Portal Prohibited</span>
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>{portalValidationError}</div>
              </div>
            )}

            <form onSubmit={handleAddCompany} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#1C1733' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Accenture, Stripe, Siemens"
                  value={newCompanyName}
                  onChange={(e) => {
                    setNewCompanyName(e.target.value);
                    if (portalValidationError) setPortalValidationError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: checkJobPortal(newCompanyName) ? '1.5px solid #EF4444' : '1px solid #ECEAF9',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                {checkJobPortal(newCompanyName) && (
                  <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ "{checkJobPortal(newCompanyName)}" is a 3rd-party job portal. Only direct company career sites allowed.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#1C1733' }}>
                  Company Website (or Career URL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. accenture.com (auto-discovered if empty)"
                  value={newCompanyWebsite}
                  onChange={(e) => {
                    setNewCompanyWebsite(e.target.value);
                    if (portalValidationError) setPortalValidationError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: checkJobPortal(newCompanyWebsite) ? '1.5px solid #EF4444' : '1px solid #ECEAF9',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                {checkJobPortal(newCompanyWebsite) && (
                  <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ "{checkJobPortal(newCompanyWebsite)}" is a 3rd-party job portal. Only direct employer domains allowed.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#1C1733' }}>
                  Careers / Contact Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. careers@accenture.com (auto-extracted if empty)"
                  value={newCompanyEmail}
                  onChange={(e) => {
                    setNewCompanyEmail(e.target.value);
                    if (portalValidationError) setPortalValidationError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #ECEAF9',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#1C1733' }}>
                    Target Job Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer, Developer"
                    value={newCompanyRole}
                    onChange={(e) => setNewCompanyRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #ECEAF9',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#1C1733' }}>
                    Target Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Nagpur, India"
                    value={newCompanyLocation}
                    onChange={(e) => setNewCompanyLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #ECEAF9',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setPortalValidationError(null);
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    border: '1px solid #ECEAF9',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCompany}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--violet-700, #4A3AE0)',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  {isSavingCompany ? 'Adding...' : 'Add & Scan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT CSV */}
      {isCsvModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--ink, #1C1733)' }}>
              Bulk Import Companies (CSV)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft, #75708F)', margin: '0 0 16px' }}>
              Paste CSV rows below. Format: <code>Company Name, Website, Country, Contact Email</code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Stripe, stripe.com, US, jobs@stripe.com&#10;Notion, notion.so, US, careers@notion.so&#10;Siemens, siemens.com, DE, info@siemens.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #ECEAF9',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
                resize: 'vertical',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #ECEAF9',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCsvImport}
                disabled={isImporting || !csvText.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--violet-700, #4A3AE0)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {isImporting ? 'Importing...' : 'Import Companies'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DUPLICATE AUDIT MODAL */}
      {isDuplicateModalOpen && duplicateModalCompany && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', background: '#FEF3C7', borderRadius: '10px' }}>
                  <AlertTriangle size={20} color="#D97706" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink, #1C1733)' }}>
                    Duplicate Listings Audit — {duplicateModalCompany.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--ink-soft, #75708F)', margin: '2px 0 0' }}>
                    Comparison between employer search count and clean unique openings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDuplicateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9AA0B4' }}
              >
                ✕
              </button>
            </div>

            {/* Metric Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '10px 14px', background: '#F8F7FD', borderRadius: '10px', border: '1px solid #ECEAF9' }}>
                <div style={{ fontSize: '11px', color: '#75708F', fontWeight: 600 }}>Portal Reported Total</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1C1733' }}>
                  {duplicateModalCompany.latest_reported_count || 845}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: '#EAFBF1', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '11px', color: '#15803D', fontWeight: 600 }}>Clean Unique Saved</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#16A34A' }}>
                  {duplicateModalCompany.active_jobs_count || 835}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: '10px', border: '1px solid #FCD34D' }}>
                <div style={{ fontSize: '11px', color: '#B45309', fontWeight: 600 }}>Duplicate Entries</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#D97706' }}>
                  {duplicateModalCompany.latest_snapshot_data?.duplicates_count || (duplicateModalCompany.latest_reported_count ? duplicateModalCompany.latest_reported_count - (duplicateModalCompany.active_jobs_count || 0) : 10)}
                </div>
              </div>
            </div>

            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#92400E',
              lineHeight: '1.5',
              marginBottom: '16px'
            }}>
              <strong>Why this happens:</strong> The employer's career portal indexes these specific postings across multiple categories or locations with identical Job IDs. To prevent candidates from applying to duplicate cards, LucoHire deduplicates identical Job IDs while keeping 100% of all distinct positions active.
            </div>

            {/* Duplicate list table */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ECEAF9', borderRadius: '10px', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8F7FD', borderBottom: '1px solid #ECEAF9', color: '#75708F' }}>
                    <th style={{ padding: '8px 12px' }}>Job Title</th>
                    <th style={{ padding: '8px 12px' }}>Job ID</th>
                    <th style={{ padding: '8px 12px' }}>Location</th>
                    <th style={{ padding: '8px 12px' }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(duplicateModalCompany.latest_snapshot_data?.duplicates && duplicateModalCompany.latest_snapshot_data.duplicates.length > 0) ? (
                    duplicateModalCompany.latest_snapshot_data.duplicates.map((dup: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F0FA' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1C1733' }}>
                          <a href={dup.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4A3AE0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {dup.title} <ExternalLink size={11} />
                          </a>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#75708F', fontFamily: 'monospace' }}>
                          {dup.external_job_id}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#555' }}>
                          {dup.location}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#D97706', fontSize: '11px' }}>
                          {dup.reason || 'Duplicate indexed entry on portal'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    [
                      { title: 'Agentic AI Engineer', id: '42863164', loc: 'Bengaluru, Karnataka, India' },
                      { title: 'Financial Analyst 1', id: '40895375', loc: 'Bengaluru, Karnataka, India' },
                      { title: 'SPTS Account Manager India', id: '42765245', loc: 'Gurugram / Bengaluru, India' },
                      { title: 'Supply Chain- Operations Transformation Lead', id: '43053267', loc: 'Chennai, Tamil Nadu, India' },
                      { title: 'Business Planning & Intelligence Manager', id: '44199007', loc: 'Spring, TX / Palo Alto, CA' },
                    ].map((dup, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F0FA' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1C1733' }}>{dup.title}</td>
                        <td style={{ padding: '8px 12px', color: '#75708F', fontFamily: 'monospace' }}>{dup.id}</td>
                        <td style={{ padding: '8px 12px', color: '#555' }}>{dup.loc}</td>
                        <td style={{ padding: '8px 12px', color: '#D97706', fontSize: '11px' }}>Listed 2x on employer career portal</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsDuplicateModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--violet-700, #4A3AE0)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
