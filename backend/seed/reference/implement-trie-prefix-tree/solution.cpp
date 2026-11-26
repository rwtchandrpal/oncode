class Trie {
    struct Node {
        Node* next[26] = {nullptr};
        bool word = false;
    };
    Node* root;

    // Follows s from the root; nullptr if the path breaks off.
    Node* walk(const string& s) {
        Node* n = root;
        for (char c : s) {
            n = n->next[c - 'a'];
            if (!n) return nullptr;
        }
        return n;
    }
public:
    Trie() { root = new Node(); }

    void insert(string word) {
        Node* n = root;
        for (char c : word) {
            if (!n->next[c - 'a']) n->next[c - 'a'] = new Node();
            n = n->next[c - 'a'];
        }
        n->word = true;
    }

    bool search(string word) {
        Node* n = walk(word);
        return n && n->word;
    }

    bool startsWith(string prefix) { return walk(prefix) != nullptr; }
};
