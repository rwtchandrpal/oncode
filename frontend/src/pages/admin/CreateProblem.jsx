import { useState } from 'react';
import { useNavigate } from 'react-router';
import axiosClient from '../../utils/axiosClient';
import ProblemForm from '../../components/admin/ProblemForm';
import { getApiErrorMessage } from '../../utils/apiError';

const DEFAULT_CPP_SNIPPET = `class Solution {
public:
    int solve(int n) {
        // Write your solution here
        return n;
    }
};`;

const DEFAULT_CPP_DRIVER = `#include <iostream>
using namespace std;

{{USER_CODE}}

int main() {
    int n;
    if (cin >> n) {
        Solution sol;
        cout << sol.solve(n) << endl;
    }
    return 0;
}`;

const DEFAULT_CPP_SOLUTION = `class Solution {
public:
    int solve(int n) {
        return n;
    }
};`;

const DEFAULT_JAVA_SNIPPET = `class Solution {
    public int solve(int n) {
        // Write your solution here
        return n;
    }
}`;

const DEFAULT_JAVA_DRIVER = `import java.util.*;

{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (in.hasNextInt()) {
            System.out.println(new Solution().solve(in.nextInt()));
        }
    }
}`;

const DEFAULT_JAVA_SOLUTION = `class Solution {
    public int solve(int n) {
        return n;
    }
}`;

const DEFAULT_VALUES = {
  title: '',
  slug: '',
  difficulty: 'Easy',
  topics: '',
  description: '',
  constraints: '',
  visibleTestCase: { input: '', expectedOutput: '' },
  hiddenTestCases: [{ input: '', expectedOutput: '' }],
  examples: [{ input: '', output: '', explanation: '' }],
  languages: {
    cpp: { enabled: true, userSnippet: DEFAULT_CPP_SNIPPET, driverCode: DEFAULT_CPP_DRIVER, solution: DEFAULT_CPP_SOLUTION },
    java: { enabled: false, userSnippet: DEFAULT_JAVA_SNIPPET, driverCode: DEFAULT_JAVA_DRIVER, solution: DEFAULT_JAVA_SOLUTION },
  },
};

const CreateProblem = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (payload) => {
    setSubmitError('');
    try {
      await axiosClient.post('/problem/', payload, { skipWakeBanner: true }); // validates on Judge0
      navigate('/admin/problems');
    } catch (err) {
      console.error('Problem creation failed:', err);
      setSubmitError(getApiErrorMessage(err, 'An unexpected error occurred while creating the problem.'));
    }
  };

  return (
    <ProblemForm
      mode="create"
      defaultValues={DEFAULT_VALUES}
      onSubmit={handleSubmit}
      heading="Create New Problem"
      subheading="Author a coding challenge with driver code and test cases for each language."
      submitError={submitError}
    />
  );
};

export default CreateProblem;
