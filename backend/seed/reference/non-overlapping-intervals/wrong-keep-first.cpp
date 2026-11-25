// Wrong: sorts by start and always keeps the earlier interval, even when it ends later.
class Solution {
public:
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        int removed = 0, end = intervals[0][1];
        for (size_t i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] >= end) end = intervals[i][1];
            else removed++;
        }
        return removed;
    }
};
