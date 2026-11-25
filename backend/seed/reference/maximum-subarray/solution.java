class Solution {
    public int maxSubArray(int[] nums) {
        int best = nums[0], current = 0;
        for (int x : nums) {
            current = Math.max(x, current + x); // extend the block or start a new one at x
            best = Math.max(best, current);
        }
        return best;
    }
}
