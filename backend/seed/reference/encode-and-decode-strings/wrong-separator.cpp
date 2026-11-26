// Wrong: joins with '#' and splits on '#', which breaks when a string contains '#' or the list is empty.
class Solution {
public:
    string encode(vector<string>& strs) {
        string out;
        for (size_t i = 0; i < strs.size(); i++) out += (i ? "#" : "") + strs[i];
        return out;
    }
    vector<string> decode(string s) {
        vector<string> out;
        string cur;
        for (char c : s) {
            if (c == '#') { out.push_back(cur); cur.clear(); }
            else cur += c;
        }
        out.push_back(cur);
        return out;
    }
};
