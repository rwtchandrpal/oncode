// Wrong: detects repeated VALUES instead of repeated nodes.
class Solution {
public:
    bool hasCycle(ListNode* head) {
        unordered_set<int> seen;
        for (int steps = 0; head && steps < 20000; head = head->next, steps++) {
            if (!seen.insert(head->val).second) return true;
        }
        return false;
    }
};
