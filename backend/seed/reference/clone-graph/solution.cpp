class Solution {
public:
    Node* cloneGraph(Node* node) {
        if (!node) return nullptr;
        unordered_map<Node*, Node*> copy;  // original -> clone
        copy[node] = new Node(node->val);
        vector<Node*> queue = {node};
        for (size_t h = 0; h < queue.size(); h++) {
            Node* cur = queue[h];
            for (Node* nb : cur->neighbors) {
                if (!copy.count(nb)) {
                    copy[nb] = new Node(nb->val);
                    queue.push_back(nb);
                }
                copy[cur]->neighbors.push_back(copy[nb]);
            }
        }
        return copy[node];
    }
};
