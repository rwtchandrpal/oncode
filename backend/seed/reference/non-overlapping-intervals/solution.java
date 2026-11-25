class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        // Sort by start; on a clash keep the interval that ends first.
        int[][] iv = intervals.clone();
        Arrays.sort(iv, (a, b) -> Integer.compare(a[0], b[0]));
        int removed = 0, end = iv[0][1];
        for (int i = 1; i < iv.length; i++) {
            if (iv[i][0] >= end) {
                end = iv[i][1];
            } else {
                removed++;
                end = Math.min(end, iv[i][1]);
            }
        }
        return removed;
    }
}
