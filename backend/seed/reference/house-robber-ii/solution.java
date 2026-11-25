class Solution {
    // Best total for houses lo..hi in a straight line.
    private int robLine(int[] nums, int lo, int hi) {
        int take = 0, skip = 0;
        for (int i = lo; i <= hi; i++) {
            int newTake = skip + nums[i];
            skip = Math.max(skip, take);
            take = newTake;
        }
        return Math.max(take, skip);
    }

    public int rob(int[] nums) {
        int n = nums.length;
        if (n == 1) return nums[0];
        // Either the first house is left out, or the last one is.
        return Math.max(robLine(nums, 0, n - 2), robLine(nums, 1, n - 1));
    }
}
