// O(n^2): for each candidate, scan the whole array.
class Solution {
    public int missingNumber(int[] nums) {
        int n = nums.length;
        for (int v = 0; v <= n; v++) {
            boolean found = false;
            for (int x : nums)
                if (x == v) { found = true; break; }
            if (!found) return v;
        }
        return -1;
    }
}
