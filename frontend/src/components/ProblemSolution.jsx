import { useState, useEffect } from 'react';
import { Check, Copy, Lightbulb, Lock } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const SolutionBlock = ({ solution }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { language, code } = solution;
  const displayLanguage = language === 'cpp' ? 'C++' : language.charAt(0).toUpperCase() + language.slice(1);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 5000);
    } catch {
      // copy failed
    }
  };

  return (
    <div className="rounded-xl border border-base-content/10 bg-base-200 overflow-hidden shadow-lg mb-6">
      <div className="flex items-center justify-between px-4 py-2 bg-base-300 border-b border-base-content/10">
        <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
          {displayLanguage} Solution
        </span>
        
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-base-content/60 hover:text-base-content transition-colors p-1"
          aria-label="Copy solution code"
        >
          {isCopied ? (
            <><Check className="w-3.5 h-3.5 text-success" /> Copied!</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy Code</>
          )}
        </button>
      </div>

      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed text-base-content">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const ProblemSolution = ({ problemId }) => {
  const [solutions, setSolutions] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchSolution = async () => {
      try {
        const { data } = await axiosClient.get(`/problem/${problemId}/solution`);
        if (isMounted) {
          setSolutions(data.referenceSolutions || []);
          setIsLocked(false);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 403) {
            setIsLocked(true);
            setMessage(err.response?.data?.message || "Solve this problem to unlock the official solution.");
          } else {
            setMessage("Failed to load reference solutions.");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (problemId) {
      fetchSolution();
    }

    return () => {
      isMounted = false;
    };
  }, [problemId]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="loading loading-spinner text-primary loading-md"></span>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="bg-warning/10 p-4 rounded-full text-warning mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-base-content mb-1">Official Solution Locked</h3>
        <p className="text-sm text-base-content/60 max-w-sm mb-4">
          {message || "Submit an Accepted solution to unlock the official approach!"}
        </p>
        <span className="badge badge-warning badge-outline text-xs">
          Solve Problem to Unlock
        </span>
      </div>
    );
  }

  if (!solutions || solutions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-base-content/50">
        <Lightbulb className="w-12 h-12 mb-4 opacity-20" />
        <p>No solution available for this problem yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-2 border-b border-base-content/10 pb-4">
        <div className="flex items-center gap-2 text-primary">
          <Lightbulb className="w-5 h-5" />
          <h2 className="text-xl font-bold text-base-content">Official Approach</h2>
        </div>
        <p className="text-base-content/60 text-sm">
          Review the reference solution to understand the optimal time and space complexity.
        </p>
      </div>

      {solutions.map((sol, index) => (
        <SolutionBlock key={index} solution={sol} />
      ))}
    </div>
  );
};

export default ProblemSolution;