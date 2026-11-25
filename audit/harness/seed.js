/*
 * Seeds the LOCAL audit database (never production) with:
 *  - one admin and one normal user (test credentials below, local-only)
 *  - 12 problems (to exercise pagination at limit=10) whose hidden test cases,
 *    driver code and reference solutions contain marker strings, so any leak to
 *    a non-admin API response is easy to grep for.
 * Problems are inserted directly because POST /problem requires Judge0 (offline).
 *
 * Usage: node audit/harness/seed.js
 */
const path = require('path');
const backend = path.join(__dirname, '..', '..', 'backend');
const mongoose = require(path.join(backend, 'node_modules', 'mongoose'));
const bcrypt = require(path.join(backend, 'node_modules', 'bcrypt'));
const User = require(path.join(backend, 'src', 'models', 'user'));
const Problem = require(path.join(backend, 'src', 'models', 'problem'));
require(path.join(backend, 'src', 'models', 'submission'));

const MONGO_URI = 'mongodb://127.0.0.1:27018/oncode_audit?replicaSet=rs0&directConnection=true';
if (!/127\.0\.0\.1|localhost/.test(MONGO_URI)) throw new Error('Refusing to seed a non-local database');

// Local-only test accounts (not real credentials).
const ACCOUNTS = [
  { firstName: 'Audit', lastName: 'Admin', email: 'admin@audit.test', password: 'AuditAdmin#2026', role: 'admin' },
  { firstName: 'Audit', lastName: 'User', email: 'user@audit.test', password: 'AuditUser#2026', role: 'user' },
  { firstName: 'Other', lastName: 'User', email: 'other@audit.test', password: 'OtherUser#2026', role: 'user' },
];

const DESCRIPTION = `Given an integer **n**, return \`n * 2\`.

### Input
A single integer.

\`\`\`cpp
int solve(int n) { return n * 2; }
\`\`\`

| n | out |
|---|-----|
| 1 | 2 |

- bullet one
- bullet two

Math (not supported by renderer): $O(n \\log n)$

XSS probe (should render inert): <img src=x onerror="window.__xss=1"> <script>window.__xss2=1</script>
[javascript link probe](javascript:window.__xss3=1)
`;

const topicsPool = [['Array', 'Math'], ['String'], ['Math'], ['Greedy', 'array'], ['Two Pointers'], ['Dynamic Programming']];
const diffs = ['Easy', 'Medium', 'Hard'];

(async () => {
  await mongoose.connect(MONGO_URI);
  await Promise.all([User.deleteMany({}), Problem.deleteMany({}), mongoose.model('Submission').deleteMany({})]);
  let admin;
  for (const a of ACCOUNTS) {
    const u = await User.create({ ...a, password: await bcrypt.hash(a.password, 10) });
    if (a.role === 'admin') admin = u;
  }
  for (let i = 1; i <= 12; i++) {
    const p = new Problem({
      title: i === 1 ? 'Double It' : `Audit Problem ${i}`,
      topics: topicsPool[i % topicsPool.length],
      description: DESCRIPTION,
      difficulty: diffs[i % 3],
      constraints: ['1 <= n <= 10^9'],
      codeSnippets: [
        { language: 'cpp', userSnippet: 'class Solution {\npublic:\n  long long solve(long long n) { return 0; }\n};',
          driverCode: '#include <iostream>\n// DRIVER_SECRET_MARKER\n{{USER_CODE}}\nint main(){long long n; std::cin>>n; Solution s; std::cout<<s.solve(n);}' },
        { language: 'java', userSnippet: 'class Solution {\n  long solve(long n) { return 0; }\n}',
          driverCode: 'import java.util.*;\n// DRIVER_SECRET_MARKER\n{{USER_CODE}}\npublic class Main{public static void main(String[] a){Scanner s=new Scanner(System.in);System.out.print(new Solution().solve(s.nextLong()));}}' },
      ],
      referenceSolutions: [{ language: 'cpp', code: '// REFERENCE_SECRET_MARKER\nclass Solution{public: long long solve(long long n){return n*2;}};' }],
      visibleTestCase: { input: '3', expectedOutput: '6' },
      hiddenTestCases: [
        { input: '41 HIDDEN_INPUT_MARKER', expectedOutput: '82 HIDDEN_OUTPUT_MARKER' },
        { input: '1000000000', expectedOutput: '2000000000' },
      ],
      examples: [{ input: 'n = 3', output: '6', explanation: '3 * 2 = 6' }],
      problemCreator: admin._id,
    });
    await p.save();
  }
  console.log('Seeded', await User.countDocuments(), 'users and', await Problem.countDocuments(), 'problems');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
