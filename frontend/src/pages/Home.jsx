import { useEffect, useState, useMemo, memo } from 'react';
import { useNavigate, useLocation } from 'react-router'; 
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle, Circle, Search, X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'; 
import axiosClient from '../utils/axiosClient';
import GlobalNavbar from '../components/GlobalNavbar';
import { openAuthModal } from '../features/auth/authSlice';

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-success/10 text-success border-success/20';
    case 'medium': return 'bg-warning/10 text-warning border-warning/20';
    case 'hard': return 'bg-error/10 text-error border-error/20';
    default: return 'bg-base-200 text-base-content/70 border-base-content/20';
  }
};

const ProblemCard = memo(({ problem, isSolved, onProblemClick }) => {
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={() => onProblemClick(problem._id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onProblemClick(problem._id);
        }
      }}
      className="group flex items-center justify-between bg-base-100 hover:bg-base-200 transition-all duration-200 p-5 rounded-xl border border-base-content/10 hover:border-base-content/20 shadow-sm cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 shrink-0">
          {isSolved ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Circle className="w-5 h-5 text-base-content/20" /> 
          )}
        </div>

        <div className="space-y-2">
          <div className="text-lg font-medium text-base-content group-hover:text-primary transition-colors">
            {problem.number ? `${problem.number}. ` : ''}{problem.title}
          </div>
          
          {problem.topics && problem.topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {problem.topics.map((topic) => (
                <span key={topic} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-base-content/10 text-base-content/80 border border-base-content/20 capitalize">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 ml-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
          {problem.difficulty || 'Unknown'}
        </span>
      </div>
    </div>
  );
});

ProblemCard.displayName = "ProblemCard";

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Intercept redirection from ProtectedRoute
  useEffect(() => {
    if (location.state?.openAuthModal && !user) {
      dispatch(openAuthModal({
        mode: 'login',
        redirectPath: location.state.from || '/'
      }));
      // Clear location state so modal doesn't re-open on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user, dispatch]);

  const handleProblemClick = (problemId) => {
    if (!user) {
      dispatch(openAuthModal({
        mode: 'login',
        redirectPath: `/problem/${problemId}`
      }));
    } else {
      navigate(`/problem/${problemId}`);
    }
  };
  
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [allTopics, setAllTopics] = useState([]);
  const limit = 10;

  // Filter State
  const [filters, setFilters] = useState({
    difficulty: 'all',
    topic: 'all',
    status: 'all'
  });

  // Debounce search input changes by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Effective status filter (guest visitors cannot filter by solved status)
  const effectiveStatus = user ? filters.status : 'all';

  // Fetch paginated problems and solved status
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = {
          page: currentPage,
          limit,
          search: debouncedSearch,
          difficulty: filters.difficulty,
          topic: filters.topic,
          status: effectiveStatus
        };

        const [problemRes, solvedRes] = await Promise.all([
          axiosClient.get('/problem/', { params }),
          user ? axiosClient.get('/problem/solved') : Promise.resolve({ data: { solvedProblems: [] } })
        ]);

        if (isMounted) {
          setProblems(problemRes.data.allProblems || []);
          setTotalProblems(problemRes.data.totalProblems || 0);
          setTotalPages(problemRes.data.totalPages || 1);
          if (problemRes.data.allTopics && problemRes.data.allTopics.length > 0) {
            setAllTopics(problemRes.data.allTopics);
          }
          setSolvedProblems(solvedRes.data.solvedProblems || []);
        }
      } catch (error) {
        console.error("Error fetching data: ", error.response?.data?.message || error.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentPage, debouncedSearch, filters.difficulty, filters.topic, effectiveStatus, user]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setFilters({
      difficulty: 'all',
      topic: 'all',
      status: 'all'
    });
    setCurrentPage(1);
  };

  const solvedIdSet = useMemo(() => {
    return new Set((solvedProblems || []).filter(Boolean).map(sp => sp._id));
  }, [solvedProblems]);

  // Generate pagination page numbers
  const paginationRange = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-base-300 font-sans text-base-content">
      
      <GlobalNavbar /> 

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Controls Section: Search Bar & Filters */}
        <div className="space-y-4 mb-8">
          
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none z-10" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search problem"
              aria-label="Search problem"
              className="input input-bordered w-full pl-11 pr-10 bg-base-100 border-base-content/20 text-base-content focus:outline-none focus:border-primary shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              name="status"
              value={effectiveStatus}
              onChange={handleFilterChange}
              aria-label="Filter by solved status"
              className="select select-bordered bg-base-100 border-base-content/20 text-base-content focus:outline-none focus:border-primary w-full sm:w-48 shadow-sm"
            >
              <option value="all">Status: All</option>
              {user && <option value="solved">Solved</option>}
              {user && <option value="unsolved">Unsolved</option>}
            </select>

            <select 
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              aria-label="Filter by difficulty"
              className="select select-bordered bg-base-100 border-base-content/20 text-base-content focus:outline-none focus:border-primary w-full sm:w-48 shadow-sm"
            >
              <option value="all">Difficulty: All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Dynamic Topics Filter */}
            <select 
              name="topic"
              value={filters.topic}
              onChange={handleFilterChange}
              aria-label="Filter by topic"
              className="select select-bordered bg-base-100 border-base-content/20 text-base-content focus:outline-none focus:border-primary w-full sm:w-48 capitalize shadow-sm"
            >
              <option value="all">Topics: All</option>
              {allTopics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            {(searchTerm || filters.difficulty !== 'all' || filters.topic !== 'all' || filters.status !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-ghost btn-sm sm:self-center text-base-content/70 hover:text-base-content gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Problems List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading State
            <div className="flex justify-center items-center py-20">
               <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : problems.length > 0 ? (
            // Render Problems
            problems.map((problem) => (
              <ProblemCard
                key={problem._id}
                problem={problem}
                isSolved={solvedIdSet.has(problem._id)}
                onProblemClick={handleProblemClick}
              />
            ))
          ) : (
            // Empty State
            <div className="text-center py-20 bg-base-100 rounded-xl border border-base-content/10 shadow-sm p-6 space-y-4">
              <h3 className="text-xl text-base-content/70 font-semibold">No problems found</h3>
              <p className="text-sm text-base-content/50 max-w-md mx-auto">
                No coding challenges match your search query or selected filters. Try broadening your criteria.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-sm btn-primary gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-base-content/10">
            <div className="text-sm text-base-content/60">
              Showing{" "}
              <span className="font-semibold text-base-content">
                {(currentPage - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-base-content">
                {Math.min(currentPage * limit, totalProblems)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-base-content">
                {totalProblems}
              </span>{" "}
              problems
            </div>

            <div className="join">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || isLoading}
                aria-label="Previous Page"
                className="join-item btn btn-sm bg-base-100 border-base-content/20 hover:bg-base-200 disabled:bg-base-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {paginationRange.map((item, idx) => (
                typeof item === 'number' ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    disabled={isLoading}
                    className={`join-item btn btn-sm ${
                      currentPage === item
                        ? "btn-primary font-bold"
                        : "bg-base-100 border-base-content/20 hover:bg-base-200 text-base-content"
                    }`}
                  >
                    {item}
                  </button>
                ) : (
                  <button 
                    key={idx} 
                    disabled 
                    className="join-item btn btn-sm btn-disabled bg-base-100 border-base-content/20 text-base-content/40"
                  >
                    ...
                  </button>
                )
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || isLoading}
                aria-label="Next Page"
                className="join-item btn btn-sm bg-base-100 border-base-content/20 hover:bg-base-200 disabled:bg-base-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;