class WordDictionary {
    struct Node {
        Node* next[26] = {nullptr};
        bool word = false;
    };
    Node* root;

    bool match(Node* n, const string& w, size_t i) {
        if (!n) return false;
        if (i == w.size()) return n->word;
        if (w[i] != '.') return match(n->next[w[i] - 'a'], w, i + 1);
        for (Node* child : n->next) {  // a dot tries every branch
            if (child && match(child, w, i + 1)) return true;
        }
        return false;
    }
public:
    WordDictionary() { root = new Node(); }

    void addWord(string word) {
        Node* n = root;
        for (char c : word) {
            if (!n->next[c - 'a']) n->next[c - 'a'] = new Node();
            n = n->next[c - 'a'];
        }
        n->word = true;
    }

    bool search(string word) { return match(root, word, 0); }
};
