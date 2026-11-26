// Wrong: accepts a stored word that only STARTS with the pattern (ignores the length).
class WordDictionary {
    vector<string> words;
public:
    WordDictionary() {}
    void addWord(string word) { words.push_back(word); }
    bool search(string word) {
        for (const string& w : words) {
            if (w.size() < word.size()) continue;
            bool ok = true;
            for (size_t i = 0; i < word.size() && ok; i++) ok = word[i] == '.' || word[i] == w[i];
            if (ok) return true;
        }
        return false;
    }
};
