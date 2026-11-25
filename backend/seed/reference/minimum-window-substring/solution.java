class Solution {
    public String minWindow(String s, String t) {
        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
        Map<Character, Integer> have = new HashMap<>();
        int satisfied = 0, left = 0, bestStart = 0, bestLen = Integer.MAX_VALUE;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (!need.containsKey(c)) continue;
            have.merge(c, 1, Integer::sum);
            if (have.get(c).intValue() == need.get(c).intValue()) satisfied++;
            while (satisfied == need.size()) {
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestStart = left;
                }
                char d = s.charAt(left++);
                if (need.containsKey(d)) {
                    if (have.get(d).intValue() == need.get(d).intValue()) satisfied--;
                    have.merge(d, -1, Integer::sum);
                }
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
    }
}
