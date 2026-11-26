import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, ChevronUp, Clock, Cpu, FileTerminal, AlertCircle, Info } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const PAGE_SIZE = 20;

// Guests only see the current guest session; say so wherever the list is shown
const GuestHistoryNote = () => (
  <p className="flex items-start gap-2 text-xs text-base-content/60 bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
    <Info className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
    This guest session only. Submissions are cleared when the session ends.
  </p>
);

const ProblemSubmissions = ({ problemId }) => {
  const isGuest = useSelector((state) => state.auth.isGuest);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  // The list has no code; details are fetched once per row on first expand
  const [details, setDetails] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSubmissions = async () => {
      if (page > 1) setIsLoadingMore(true);
      try {
        const { data } = await axiosClient.get(`/problem/submissions/${problemId}`, { params: { page, limit: PAGE_SIZE } });
        if (!isMounted) return;
        setSubmissions((prev) => (page === 1 ? data.submissions || [] : [...prev, ...(data.submissions || [])]));
        setTotalPages(data.totalPages || 1);
      } catch {
        if (isMounted) setError("Failed to load submissions.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    };

    if (problemId) {
      fetchSubmissions();
    }
    return () => { isMounted = false; };
  }, [problemId, page]);

  const loadDetail = async (id) => {
    if (details[id]) return;
    setDetails((prev) => ({ ...prev, [id]: { loading: true } }));
    try {
      const { data } = await axiosClient.get(`/submission/${id}`);
      setDetails((prev) => ({ ...prev, [id]: { loading: false, ...data.submission } }));
    } catch {
      setDetails((prev) => ({ ...prev, [id]: { loading: false, failed: true } }));
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'text-success';
      default: return 'text-error';
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleExpand = (id) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) loadDetail(next);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-10">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-16 bg-base-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-base-content/50">
        <AlertCircle className="w-10 h-10 mb-4 text-error/50" />
        <p>{error}</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="pb-10">
        {isGuest && <GuestHistoryNote />}
        <div className="flex flex-col items-center justify-center py-20 text-base-content/50">
          <FileTerminal className="w-12 h-12 mb-4 opacity-20" />
          <p>You have not submitted any code for this problem yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-xl font-bold text-base-content border-b border-base-content/10 pb-2 mb-4">Past Submissions</h2>
      {isGuest && <GuestHistoryNote />}
      
      {submissions.map((sub) => {
        const isExpanded = expandedId === sub._id;
        const detail = details[sub._id];
        
        return (
          <div key={sub._id} className="bg-base-100 border border-base-content/10 rounded-lg overflow-hidden transition-all duration-200 hover:border-base-content/20">
            
            <div 
              onClick={() => toggleExpand(sub._id)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-base-200 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <span className={`text-lg font-bold ${getStatusColor(sub.status)} capitalize`}>
                  {sub.status || 'Pending'}
                </span>
                <span className="text-xs font-medium text-base-content/50">
                  {sub.testCasesPassed} / {sub.testCasesTotal} Testcases Passed
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs text-base-content/60">
                <div className="hidden sm:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {sub.runtime} ms</span>
                    <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {sub.memory} MB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base-content/80 uppercase">{sub.language}</span>
                    <span>•</span>
                    <span>{formatDate(sub.createdAt)}</span>
                  </div>
                </div>
                
                {/* Mobile Date Fallback */}
                <span className="sm:hidden">{formatDate(sub.createdAt)}</span>
                
                {isExpanded ? <ChevronUp className="w-5 h-5 text-base-content/50" /> : <ChevronDown className="w-5 h-5 text-base-content/50" />}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-base-content/10 bg-base-300">
                {(!detail || detail.loading) && (
                  <div className="p-4 flex justify-center"><span className="loading loading-spinner loading-sm text-primary"></span></div>
                )}
                {detail?.failed && (
                  <p className="p-4 text-sm text-error">Couldn't load this submission. Try again.</p>
                )}
                {detail && !detail.loading && !detail.failed && (
                  <>
                    {detail.errorMessage && (
                      <div className="p-4 bg-error/10 border-b border-error/20">
                        <p className="text-error font-mono text-xs whitespace-pre-wrap">{detail.errorMessage}</p>
                      </div>
                    )}

                    {/* Code Block */}
                    <div className="p-4 overflow-x-auto">
                      <pre className="text-sm font-mono leading-relaxed text-base-content">
                        <code>{detail.code}</code>
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {page < totalPages && (
        <div className="flex justify-center pt-2">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPage((p) => p + 1)} disabled={isLoadingMore}>
            {isLoadingMore ? <span className="loading loading-spinner loading-xs"></span> : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemSubmissions;