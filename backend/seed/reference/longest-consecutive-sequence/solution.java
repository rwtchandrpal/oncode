class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> values = new HashSet<>();
        for (int x : nums) values.add(x);
        int best = 0;
        for (int x : values) {
            if (values.contains(x - 1)) continue; // only start counting at the beginning of a run
            int length = 1;
            while (values.contains(x + length)) length++;
            best = Math.max(best, length);
        }
        return best;
    }
}
