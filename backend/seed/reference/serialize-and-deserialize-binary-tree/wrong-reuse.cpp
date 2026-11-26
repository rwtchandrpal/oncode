// Wrong: smuggles the original root through a static pointer instead of really decoding.
class Codec {
    static TreeNode* saved;
public:
    string serialize(TreeNode* root) { saved = root; return "x"; }
    TreeNode* deserialize(string data) { (void)data; return saved; }
};
TreeNode* Codec::saved = nullptr;
