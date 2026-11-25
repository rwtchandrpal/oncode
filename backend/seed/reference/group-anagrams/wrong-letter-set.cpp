// Wrong: groups by the set of letters, ignoring how often each occurs ("aab" with "abb").
class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        map<string, vector<string>> groups;
        for (const string& s : strs) {
            set<char> letters(s.begin(), s.end());
            groups[string(letters.begin(), letters.end())].push_back(s);
        }
        vector<vector<string>> result;
        for (auto& g : groups) result.push_back(g.second);
        return result;
    }
};
