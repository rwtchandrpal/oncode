class Solution {
public:
    void reorderList(ListNode* head) {
        // 1. find the middle, 2. reverse the second half, 3. weave the two halves together
        ListNode *slow = head, *fast = head;
        while (fast->next && fast->next->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        ListNode* second = slow->next;
        slow->next = nullptr;
        ListNode* prev = nullptr;
        while (second) {
            ListNode* next = second->next;
            second->next = prev;
            prev = second;
            second = next;
        }
        ListNode* first = head;
        second = prev;
        while (second) {
            ListNode* n1 = first->next;
            ListNode* n2 = second->next;
            first->next = second;
            second->next = n1;
            first = n1;
            second = n2;
        }
    }
};
