class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Long, Integer> indexOf = new HashMap<>(nums.length * 2);
        for (int i = 0; i < nums.length; i++) {
            long need = (long) target - nums[i];
            Integer j = indexOf.get(need);
            if (j != null) return new int[] {j, i};
            indexOf.put((long) nums[i], i);
        }
        return new int[0];
    }
}
