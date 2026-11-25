class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        int n = s.length();
        boolean[] ok = new boolean[n + 1]; // ok[i]: the suffix starting at i can be split
        ok[n] = true;
        for (int i = n - 1; i >= 0; i--) {
            for (String w : wordDict) {
                if (s.startsWith(w, i) && ok[i + w.length()]) {
                    ok[i] = true;
                    break;
                }
            }
        }
        return ok[0];
    }
}
