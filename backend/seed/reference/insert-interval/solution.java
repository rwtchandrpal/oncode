class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        // Add the new interval, sort, and merge everything (independent of the C++ approach).
        List<int[]> all = new ArrayList<>(Arrays.asList(intervals));
        all.add(newInterval.clone());
        all.sort((a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : all) {
            if (!merged.isEmpty() && iv[0] <= merged.get(merged.size() - 1)[1]) {
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], iv[1]);
            } else {
                merged.add(new int[] {iv[0], iv[1]});
            }
        }
        return merged.toArray(new int[0][]);
    }
}
