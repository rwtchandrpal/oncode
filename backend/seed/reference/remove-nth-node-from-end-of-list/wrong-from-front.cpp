// Wrong: removes the n-th node from the FRONT (1-based).
class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        if (n == 1) return head->next;
        ListNode* prev = head;
        for (int i = 1; i < n - 1 && prev->next; i++) prev = prev->next;
        if (prev->next) prev->next = prev->next->next;
        return head;
    }
};
