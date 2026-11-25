class Solution {
    public int characterReplacement(String s, int k) {
        // For each target letter, the longest window with at most k other letters.
        int best = 0;
        for (char target = 'A'; target <= 'Z'; target++) {
            int left = 0, others = 0;
            for (int right = 0; right < s.length(); right++) {
                if (s.charAt(right) != target) others++;
                while (others > k) {
                    if (s.charAt(left) != target) others--;
                    left++;
                }
                best = Math.max(best, right - left + 1);
            }
        }
        return best;
    }
}
