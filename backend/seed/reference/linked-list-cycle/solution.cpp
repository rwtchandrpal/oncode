class Solution {
public:
    bool hasCycle(ListNode* head) {
        // Floyd: a fast pointer (2 steps) meets the slow one (1 step) only inside a cycle.
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};
