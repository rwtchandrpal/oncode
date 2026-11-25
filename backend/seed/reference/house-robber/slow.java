// Exponential: tries robbing / skipping every house without memoisation.
class Solution {
    int best(int[] nums, int i) {
        if (i >= nums.length) return 0;
        return Math.max(nums[i] + best(nums, i + 2), best(nums, i + 1));
    }
    public int rob(int[] nums) { return best(nums, 0); }
}
