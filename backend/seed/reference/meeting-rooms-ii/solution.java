class Solution {
    public int minMeetingRooms(int[][] intervals) {
        // Sweep: +1 at each start, -1 at each end; ends sort before starts at the same time.
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int rooms = 0, best = 0, e = 0;
        for (int s = 0; s < n; s++) {
            while (e < n && ends[e] <= starts[s]) { rooms--; e++; }
            rooms++;
            best = Math.max(best, rooms);
        }
        return best;
    }
}
