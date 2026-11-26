// Wrong: ignores the "longer word before its prefix" contradiction.
class Solution {
public:
    string alienOrder(vector<string>& words) {
        bool present[26] = {false};
        for (auto& w : words) for (char c : w) present[c - 'a'] = true;
        vector<set<int>> after(26);
        int indeg[26] = {0};
        for (size_t i = 1; i < words.size(); i++) {
            const string& a = words[i - 1];
            const string& b = words[i];
            size_t k = 0;
            while (k < a.size() && k < b.size() && a[k] == b[k]) k++;
            if (k < a.size() && k < b.size() && after[a[k] - 'a'].insert(b[k] - 'a').second) indeg[b[k] - 'a']++;
        }
        vector<int> ready;
        int letters = 0;
        for (int c = 0; c < 26; c++) if (present[c]) { letters++; if (!indeg[c]) ready.push_back(c); }
        string order;
        while (!ready.empty()) {
            int c = ready.back();
            ready.pop_back();
            order += (char)('a' + c);
            for (int y : after[c]) if (--indeg[y] == 0) ready.push_back(y);
        }
        return (int)order.size() == letters ? order : "";
    }
};
