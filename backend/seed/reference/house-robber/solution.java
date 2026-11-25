class Solution {
    public int rob(int[] nums) {
        int take = 0, skip = 0; // best total if the previous house was robbed / not robbed
        for (int x : nums) {
            int newTake = skip + x;
            skip = Math.max(skip, take);
            take = newTake;
        }
        return Math.max(take, skip);
    }
}
