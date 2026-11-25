class Solution {
public:
    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {
        vector<vector<int>> result;
        int start = newInterval[0], end = newInterval[1];
        size_t i = 0, n = intervals.size();
        while (i < n && intervals[i][1] < start) result.push_back(intervals[i++]);  // entirely before
        while (i < n && intervals[i][0] <= end) {  // overlapping: absorb into the new interval
            start = min(start, intervals[i][0]);
            end = max(end, intervals[i][1]);
            i++;
        }
        result.push_back({start, end});
        while (i < n) result.push_back(intervals[i++]);  // entirely after
        return result;
    }
};
