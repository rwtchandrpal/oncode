class Solution {
public:
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        // Keep intervals greedily by earliest end; everything that clashes with a kept one is removed.
        sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });
        int removed = 0;
        int lastEnd = INT_MIN;
        for (auto& iv : intervals) {
            if (iv[0] >= lastEnd) lastEnd = iv[1];
            else removed++;
        }
        return removed;
    }
};
