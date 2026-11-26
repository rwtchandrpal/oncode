// Wrong: copies only the first node and points it at the ORIGINAL neighbours.
class Solution {
public:
    Node* cloneGraph(Node* node) {
        if (!node) return nullptr;
        return new Node(node->val, node->neighbors);
    }
};
