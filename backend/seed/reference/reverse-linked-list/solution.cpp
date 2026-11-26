class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        while (head) {
            ListNode* next = head->next;
            head->next = prev;  // turn this link around
            prev = head;
            head = next;
        }
        return prev;
    }
};
