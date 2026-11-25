// Linked list and binary tree support for generated drivers. Each structure has:
//   cppHeader / javaClass   the node type, defined by the driver (the user sees it as a comment)
//   cppHelpers / javaHelpers  build-from-array and print-as-array helpers
//   cppDoc / javaDoc        the comment block shown at the top of the starter code
// Serialised forms: a list is [1,2,3]; a tree is level order with null for missing children and
// trailing nulls removed, e.g. [1,null,2,3].

const LIMIT_MSG = "driver: returned structure is too large or has a cycle";

const list = {
  cppHeader: `struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};`,
  cppHelpers: `namespace oncode {
ListNode* buildList(const std::vector<int>& v) {
    ListNode dummy;
    ListNode* tail = &dummy;
    for (int x : v) {
        tail->next = new ListNode(x);
        tail = tail->next;
    }
    return dummy.next;
}
std::vector<int> listOut(ListNode* h) {
    std::vector<int> r;
    for (; h; h = h->next) {
        r.push_back(h->val);
        if (r.size() > 200000) { std::cerr << "${LIMIT_MSG}\\n"; std::exit(4); }
    }
    return r;
}
}  // namespace oncode`,
  cppDoc: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */`,
  javaClass: `class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`,
  javaHelpers: `    static ListNode buildList(int[] v) {
        ListNode dummy = new ListNode();
        ListNode tail = dummy;
        for (int x : v) {
            tail.next = new ListNode(x);
            tail = tail.next;
        }
        return dummy.next;
    }
    static ListNode[] buildLists(int[][] v) {
        ListNode[] r = new ListNode[v.length];
        for (int i = 0; i < v.length; i++) r[i] = buildList(v[i]);
        return r;
    }
    static List<Integer> listOut(ListNode h) {
        List<Integer> r = new ArrayList<>();
        for (; h != null; h = h.next) {
            r.add(h.val);
            if (r.size() > 200000) throw new IllegalStateException("${LIMIT_MSG}");
        }
        return r;
    }`,
  javaDoc: `/**
 * Definition for singly-linked list.
 * class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */`,
};

const tree = {
  cppHeader: `struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};`,
  cppHelpers: `namespace oncode {
TreeNode* buildTree(const std::vector<Opt>& v) {
    if (v.empty() || !v[0].has) return nullptr;
    TreeNode* root = new TreeNode(v[0].v);
    std::queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < v.size()) {
        TreeNode* n = q.front();
        q.pop();
        if (i < v.size() && v[i].has) { n->left = new TreeNode(v[i].v); q.push(n->left); }
        i++;
        if (i < v.size() && v[i].has) { n->right = new TreeNode(v[i].v); q.push(n->right); }
        i++;
    }
    return root;
}
std::vector<Opt> treeOut(TreeNode* root) {
    std::vector<Opt> r;
    std::queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* n = q.front();
        q.pop();
        Opt o;
        if (n) {
            o.has = true;
            o.v = n->val;
            q.push(n->left);
            q.push(n->right);
        }
        r.push_back(o);
        if (r.size() > 400000) { std::cerr << "${LIMIT_MSG}\\n"; std::exit(4); }
    }
    while (!r.empty() && !r.back().has) r.pop_back();
    return r;
}
TreeNode* findNode(TreeNode* root, int val) {
    std::vector<TreeNode*> st;
    if (root) st.push_back(root);
    while (!st.empty()) {
        TreeNode* n = st.back();
        st.pop_back();
        if (n->val == val) return n;
        if (n->left) st.push_back(n->left);
        if (n->right) st.push_back(n->right);
    }
    return nullptr;
}
Opt nodeVal(TreeNode* n) {
    Opt o;
    if (n) { o.has = true; o.v = n->val; }
    return o;
}
}  // namespace oncode`,
  cppDoc: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */`,
  javaClass: `class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}`,
  javaHelpers: `    static TreeNode buildTree(List<Integer> v) {
        if (v.isEmpty() || v.get(0) == null) return null;
        TreeNode root = new TreeNode(v.get(0));
        List<TreeNode> q = new ArrayList<>();
        q.add(root);
        int head = 0, i = 1;
        while (head < q.size() && i < v.size()) {
            TreeNode n = q.get(head++);
            if (i < v.size() && v.get(i) != null) { n.left = new TreeNode(v.get(i)); q.add(n.left); }
            i++;
            if (i < v.size() && v.get(i) != null) { n.right = new TreeNode(v.get(i)); q.add(n.right); }
            i++;
        }
        return root;
    }
    static List<Integer> treeOut(TreeNode root) {
        List<Integer> r = new ArrayList<>();
        List<TreeNode> q = new ArrayList<>();
        q.add(root);
        for (int head = 0; head < q.size(); head++) {
            TreeNode n = q.get(head);
            if (n == null) { r.add(null); continue; }
            r.add(n.val);
            q.add(n.left);
            q.add(n.right);
            if (r.size() > 400000) throw new IllegalStateException("${LIMIT_MSG}");
        }
        while (!r.isEmpty() && r.get(r.size() - 1) == null) r.remove(r.size() - 1);
        return r;
    }
    static TreeNode findNode(TreeNode root, int val) {
        Deque<TreeNode> st = new ArrayDeque<>();
        if (root != null) st.push(root);
        while (!st.isEmpty()) {
            TreeNode n = st.pop();
            if (n.val == val) return n;
            if (n.left != null) st.push(n.left);
            if (n.right != null) st.push(n.right);
        }
        return null;
    }
    static Integer nodeVal(TreeNode n) { return n == null ? null : n.val; }`,
  javaDoc: `/**
 * Definition for a binary tree node.
 * class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 *     TreeNode(int val, TreeNode left, TreeNode right) {
 *         this.val = val;
 *         this.left = left;
 *         this.right = right;
 *     }
 * }
 */`,
};

module.exports = { list, tree };
