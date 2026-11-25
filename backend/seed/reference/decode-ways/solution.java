class Solution {
    public int numDecodings(String s) {
        int n = s.length();
        long[] ways = new long[n + 1]; // ways[i] = decodings of the suffix starting at i
        ways[n] = 1;
        for (int i = n - 1; i >= 0; i--) {
            if (s.charAt(i) == '0') continue; // no code starts with 0
            ways[i] = ways[i + 1];
            if (i + 1 < n && Integer.parseInt(s.substring(i, i + 2)) <= 26) ways[i] += ways[i + 2];
        }
        return (int) ways[0];
    }
}
