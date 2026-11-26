// Wrong: search() only checks the path exists, so a prefix counts as a word.
class Trie {
    set<string> prefixes;
public:
    Trie() {}
    void insert(string word) {
        for (size_t i = 1; i <= word.size(); i++) prefixes.insert(word.substr(0, i));
    }
    bool search(string word) { return prefixes.count(word) > 0; }
    bool startsWith(string prefix) { return prefixes.count(prefix) > 0; }
};
