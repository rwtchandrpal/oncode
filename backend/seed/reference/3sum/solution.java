class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        // For each first index, a hash set of values seen after it (independent of the C++ two-pointer one).
        int[] a = nums.clone();
        Arrays.sort(a);
        Set<List<Integer>> found = new HashSet<>();
        for (int i = 0; i < a.length - 2; i++) {
            if (i > 0 && a[i] == a[i - 1]) continue;
            Set<Integer> seen = new HashSet<>();
            for (int j = i + 1; j < a.length; j++) {
                int need = -a[i] - a[j];
                if (seen.contains(need)) found.add(Arrays.asList(a[i], need, a[j]));
                seen.add(a[j]);
            }
        }
        return new ArrayList<>(found);
    }
}
