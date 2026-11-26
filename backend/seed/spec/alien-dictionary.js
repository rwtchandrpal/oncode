// Any valid order is accepted. The driver checks the returned order against the words (it must use
// every letter once and keep the list sorted) and, if valid, prints the alphabetically smallest valid
// order instead, so all correct answers produce the same output. Invalid answers are printed as is.
const postCpp = `{
    bool oc_present[26] = {false};
    size_t oc_count = 0;
    for (auto& w : words) for (char c : w) if (!oc_present[c - 'a']) { oc_present[c - 'a'] = true; oc_count++; }
    int oc_rank[26];
    fill(oc_rank, oc_rank + 26, -1);
    bool oc_ok = !oc_res.empty() && oc_res.size() == oc_count;
    for (size_t i = 0; oc_ok && i < oc_res.size(); i++) {
        char c = oc_res[i];
        if (c < 'a' || c > 'z' || !oc_present[c - 'a'] || oc_rank[c - 'a'] != -1) oc_ok = false;
        else oc_rank[c - 'a'] = (int)i;
    }
    for (size_t i = 1; oc_ok && i < words.size(); i++) {
        const string& a = words[i - 1];
        const string& b = words[i];
        size_t k = 0;
        while (k < a.size() && k < b.size() && a[k] == b[k]) k++;
        if (k == a.size() || k == b.size()) { if (a.size() > b.size()) oc_ok = false; }
        else if (oc_rank[a[k] - 'a'] > oc_rank[b[k] - 'a']) oc_ok = false;
    }
    if (oc_ok) {
        vector<set<int>> oc_after(26);
        int oc_indeg[26] = {0};
        for (size_t i = 1; i < words.size(); i++) {
            const string& a = words[i - 1];
            const string& b = words[i];
            size_t k = 0;
            while (k < a.size() && k < b.size() && a[k] == b[k]) k++;
            if (k < a.size() && k < b.size() && oc_after[a[k] - 'a'].insert(b[k] - 'a').second) oc_indeg[b[k] - 'a']++;
        }
        priority_queue<int, vector<int>, greater<int>> oc_pq;
        for (int c = 0; c < 26; c++) if (oc_present[c] && oc_indeg[c] == 0) oc_pq.push(c);
        string oc_smallest;
        while (!oc_pq.empty()) {
            int c = oc_pq.top();
            oc_pq.pop();
            oc_smallest += (char)('a' + c);
            for (int y : oc_after[c]) if (--oc_indeg[y] == 0) oc_pq.push(y);
        }
        oc_res = oc_smallest;
    }
}`;

const postJava = `{
    boolean[] oc_present = new boolean[26];
    int oc_count = 0;
    for (String w : words) for (char c : w.toCharArray()) if (!oc_present[c - 'a']) { oc_present[c - 'a'] = true; oc_count++; }
    int[] oc_rank = new int[26];
    Arrays.fill(oc_rank, -1);
    boolean oc_ok = oc_res != null && !oc_res.isEmpty() && oc_res.length() == oc_count;
    for (int i = 0; oc_ok && i < oc_res.length(); i++) {
        char c = oc_res.charAt(i);
        if (c < 'a' || c > 'z' || !oc_present[c - 'a'] || oc_rank[c - 'a'] != -1) oc_ok = false;
        else oc_rank[c - 'a'] = i;
    }
    for (int i = 1; oc_ok && i < words.length; i++) {
        String a = words[i - 1], b = words[i];
        int k = 0;
        while (k < a.length() && k < b.length() && a.charAt(k) == b.charAt(k)) k++;
        if (k == a.length() || k == b.length()) { if (a.length() > b.length()) oc_ok = false; }
        else if (oc_rank[a.charAt(k) - 'a'] > oc_rank[b.charAt(k) - 'a']) oc_ok = false;
    }
    if (oc_ok) {
        List<TreeSet<Integer>> oc_after = new ArrayList<>();
        for (int c = 0; c < 26; c++) oc_after.add(new TreeSet<>());
        int[] oc_indeg = new int[26];
        for (int i = 1; i < words.length; i++) {
            String a = words[i - 1], b = words[i];
            int k = 0;
            while (k < a.length() && k < b.length() && a.charAt(k) == b.charAt(k)) k++;
            if (k < a.length() && k < b.length() && oc_after.get(a.charAt(k) - 'a').add(b.charAt(k) - 'a')) oc_indeg[b.charAt(k) - 'a']++;
        }
        PriorityQueue<Integer> oc_pq = new PriorityQueue<>();
        for (int c = 0; c < 26; c++) if (oc_present[c] && oc_indeg[c] == 0) oc_pq.add(c);
        StringBuilder oc_smallest = new StringBuilder();
        while (!oc_pq.isEmpty()) {
            int c = oc_pq.poll();
            oc_smallest.append((char) ('a' + c));
            for (int y : oc_after.get(c)) if (--oc_indeg[y] == 0) oc_pq.add(y);
        }
        oc_res = oc_smallest.toString();
    }
}`;

module.exports = {
  slug: "alien-dictionary",
  signature: { method: "alienOrder", params: [{ name: "words", type: "string[]" }], returns: "string" },
  post: { cpp: postCpp, java: postJava },
  description: `
An alien language uses the lowercase English letters, but in an unknown order. You are given a list of \`words\` from its dictionary, **sorted** in the alien alphabetical order. (As usual, a word comes before any longer word that it is a prefix of.)

Work out an order of the letters that is consistent with the list, and return it as a string containing **every letter that appears in \`words\`, each exactly once**. If several orders are consistent, return any of them. If no order is consistent (the list contradicts itself), return \`""\`.

**Checking:** any consistent order is accepted. To compare answers, the judge prints the alphabetically smallest consistent order whenever your answer is valid, and prints your answer unchanged otherwise.
`,
  constraints: ["1 <= words.length <= 100", "1 <= words[i].length <= 100", "words[i] consists of lowercase English letters"],
  examples: [
    { explanation: "\"cab\" before \"cba\" puts a before b, and \"cba\" before \"ab\" puts c before a, so the only consistent order is c, a, b." },
    { explanation: "\"abc\" cannot come before its own prefix \"ab\", so the list is contradictory." },
    { explanation: "A single word gives no ordering information, so its letters may be in any order." },
  ],
  notes: "Multiple valid answers: driver validates the order and prints the smallest valid order (post hook).",
};
