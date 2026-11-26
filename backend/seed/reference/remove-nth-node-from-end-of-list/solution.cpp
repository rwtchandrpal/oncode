class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        // One pass: `ahead` runs n + 1 nodes in front, so `behind` stops just before the target.
        ListNode dummy(0, head);
        ListNode *ahead = &dummy, *behind = &dummy;
        for (int i = 0; i <= n; i++) ahead = ahead->next;
        while (ahead) {
            ahead = ahead->next;
            behind = behind->next;
        }
        behind->next = behind->next->next;
        return dummy.next;
    }
};
