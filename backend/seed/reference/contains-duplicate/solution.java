class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>(nums.length * 2);
        for (int x : nums) {
            if (!seen.add(x)) return true;
        }
        return false;
    }
}
