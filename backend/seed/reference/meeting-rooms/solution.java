class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }
        Arrays.sort(starts);
        Arrays.sort(ends);
        // with sorted starts and ends, meeting i+1 must start no earlier than meeting i ends
        for (int i = 0; i + 1 < n; i++) {
            if (starts[i + 1] < ends[i]) return false;
        }
        return true;
    }
}
