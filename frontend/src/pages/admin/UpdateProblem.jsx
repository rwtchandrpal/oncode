import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { AlertCircle } from 'lucide-react';
import axiosClient from '../../utils/axiosClient';
import ProblemForm from '../../components/admin/ProblemForm';
import { problemToFormValues } from '../../validations/problemSchema';
import { getApiErrorMessage } from '../../utils/apiError';

// Edits every part of a problem. Prefilled from the admin-only GET /problem/:id/admin,
// which includes hidden test cases, driver code and reference solutions. The backend only re-runs
// Judge0 validation when tests, snippets or solutions actually changed.
const UpdateProblem = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();

  const [defaultValues, setDefaultValues] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchProblem = async () => {
      try {
        const { data } = await axiosClient.get(`/problem/${problemId}/admin`);
        if (isMounted) setDefaultValues(problemToFormValues(data.problem));
      } catch (err) {
        console.error('Error fetching problem:', err);
        if (isMounted) setLoadError(getApiErrorMessage(err, 'Failed to load problem data. It may have been deleted.'));
      }
    };
    fetchProblem();
    return () => {
      isMounted = false;
    };
  }, [problemId]);

  const handleSubmit = async (payload) => {
    setSubmitError('');
    try {
      await axiosClient.put(`/problem/${problemId}`, payload, { skipWakeBanner: true }); // validates on Judge0
      navigate('/admin/problems');
    } catch (err) {
      console.error('Failed to update problem:', err);
      setSubmitError(getApiErrorMessage(err, 'An unexpected error occurred.'));
    }
  };

  if (loadError) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div role="alert" className="alert alert-error text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{loadError}</span>
        </div>
        <Link to="/admin/problems" className="btn btn-sm btn-ghost">Back to problems</Link>
      </div>
    );
  }

  if (!defaultValues) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  return (
    <ProblemForm
      mode="edit"
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      heading="Update Problem"
      subheading="Edit details, test cases, driver code and solutions."
      submitError={submitError}
    />
  );
};

export default UpdateProblem;
