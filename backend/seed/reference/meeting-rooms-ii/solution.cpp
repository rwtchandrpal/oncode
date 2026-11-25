class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        priority_queue<int, vector<int>, greater<int>> ends;  // end times of rooms in use
        for (auto& m : intervals) {
            if (!ends.empty() && ends.top() <= m[0]) ends.pop();  // reuse the room that frees first
            ends.push(m[1]);
        }
        return (int)ends.size();
    }
};
