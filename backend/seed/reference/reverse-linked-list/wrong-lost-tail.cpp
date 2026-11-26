// Wrong: reverses but drops the original head (off-by-one in the loop).
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        if (!head) return nullptr;
        ListNode* prev = nullptr;
        ListNode* cur = head->next;
        while (cur) {
            ListNode* next = cur->next;
            cur->next = prev;
            prev = cur;
            cur = next;
        }
        return prev;
    }
};
