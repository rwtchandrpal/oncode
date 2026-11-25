import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Code2, Users, Activity, Target, Shield, User, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import axiosClient from '../../utils/axiosClient';
import { getApiErrorMessage } from '../../utils/apiError';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardStats = async () => {
      try {
        const response = await axiosClient.get('/admin/dashboard');
        if (isMounted) {
          setData(response.data);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          console.error("Dashboard Stats Error:", err);
          setError(getApiErrorMessage(err, "Failed to fetch dashboard statistics. Please try again."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardStats();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  const handleRetry = () => {
    setIsLoading(true);
    setError('');
    setReloadTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-base-200 rounded-xl border border-error/20 text-center space-y-4 max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-error mx-auto opacity-80" />
        <h3 className="text-lg font-bold text-base-content">Unable to Load Dashboard</h3>
        <p className="text-sm text-base-content/70">{error}</p>
        <button onClick={handleRetry} className="btn btn-sm btn-primary gap-2">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Helper calculation for progress bars with division-by-zero protection
  const easyCount = data.difficulty?.easy || 0;
  const mediumCount = data.difficulty?.medium || 0;
  const hardCount = data.difficulty?.hard || 0;
  const totalProblems = easyCount + mediumCount + hardCount || 1;

  const standardUsers = data.demographics?.standard || 0;
  const adminUsers = data.demographics?.admin || 0;
  const totalUsers = standardUsers + adminUsers || 1;

  const standardUserPct = ((standardUsers / totalUsers) * 100).toFixed(1);
  const adminUserPct = ((adminUsers / totalUsers) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Platform Overview</h1>
          <p className="text-base-content/60 text-sm mt-1">Real-time metrics and analytical breakdowns.</p>
        </div>
        <Link
          to="/admin/create-problem"
          className="btn btn-primary btn-sm gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Problem
        </Link>
      </div>

      {/* --- TOP ROW: CORE METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Problems Card */}
        <div className="bg-base-200 p-6 rounded-xl border border-base-content/10 flex items-center justify-between">
          <div>
            <p className="text-base-content/60 text-sm font-medium mb-1">Total Problems</p>
            <h3 className="text-3xl font-bold text-base-content">{data.metrics?.totalProblems ?? 0}</h3>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            <Code2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-base-200 p-6 rounded-xl border border-base-content/10 flex items-center justify-between">
          <div>
            <p className="text-base-content/60 text-sm font-medium mb-1">Total Users</p>
            <h3 className="text-3xl font-bold text-base-content">{data.metrics?.totalUsers ?? 0}</h3>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Submissions Card */}
        <div className="bg-base-200 p-6 rounded-xl border border-base-content/10 flex items-center justify-between">
          <div>
            <p className="text-base-content/60 text-sm font-medium mb-1">Total Submissions</p>
            <h3 className="text-3xl font-bold text-base-content">{(data.metrics?.totalSubmissions ?? 0).toLocaleString()}</h3>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            <Activity className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* --- MIDDLE ROW: ANALYTICAL BREAKDOWNS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Platform Acceptance Rate */}
        <div className="bg-base-200 p-6 rounded-xl border border-base-content/10 flex flex-col items-center justify-center text-center">
          <div className="w-full flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-base-content">Acceptance Rate</h2>
            <Target className="w-5 h-5 text-base-content/50" />
          </div>
          
          {/* DaisyUI Radial Progress */}
          <div 
            className="radial-progress text-primary font-bold text-2xl" 
            style={{ "--value": data.acceptanceRate || 0, "--size": "8rem", "--thickness": "8px" }} 
            role="progressbar"
          >
            {data.acceptanceRate || 0}%
          </div>
          <p className="text-base-content/60 text-sm mt-6">
            Percentage of total submissions resulting in "Accepted" status.
          </p>
        </div>

        {/* 2. Problem Difficulty Distribution */}
        <div className="bg-base-200 p-6 rounded-xl border border-base-content/10">
          <h2 className="text-lg font-semibold text-base-content mb-6">Difficulty Distribution</h2>
          
          <div className="space-y-5">
            {/* Easy */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-success font-medium">Easy</span>
                <span className="text-base-content/60">{easyCount} problems</span>
              </div>
              <progress className="progress progress-success w-full bg-base-300" value={easyCount} max={totalProblems}></progress>
            </div>
            
            {/* Medium */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-warning font-medium">Medium</span>
                <span className="text-base-content/60">{mediumCount} problems</span>
              </div>
              <progress className="progress progress-warning w-full bg-base-300" value={mediumCount} max={totalProblems}></progress>
            </div>
            
            {/* Hard */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-error font-medium">Hard</span>
                <span className="text-base-content/60">{hardCount} problems</span>
              </div>
              <progress className="progress progress-error w-full bg-base-300" value={hardCount} max={totalProblems}></progress>
            </div>
          </div>
        </div>

        {/* 3. User Demographics */}
        <div className="bg-base-200 p-6 rounded-xl border border-base-content/10">
          <h2 className="text-lg font-semibold text-base-content mb-6">User Demographics</h2>
          
          <div className="space-y-4">
            {/* Standard Users */}
            <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg border border-base-content/10">
              <div className="flex items-center gap-3">
                <div className="bg-base-300 p-2 rounded-md text-base-content/60">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base-content font-medium">Standard Users</p>
                  <p className="text-xs text-base-content/50">{standardUserPct}% of platform</p>
                </div>
              </div>
              <span className="text-xl font-bold text-base-content">{standardUsers}</span>
            </div>

            {/* Administrators */}
            <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg border border-base-content/10">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-md text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base-content font-medium">Administrators</p>
                  <p className="text-xs text-base-content/50">{adminUserPct}% of platform</p>
                </div>
              </div>
              <span className="text-xl font-bold text-base-content">{adminUsers}</span>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;