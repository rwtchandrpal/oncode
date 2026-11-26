// Wrong: concatenates the lists without merging.
class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        ListNode dummy;
        ListNode* tail = &dummy;
        for (ListNode* l : lists) {
            tail->next = l;
            while (tail->next) tail = tail->next;
        }
        return dummy.next;
    }
};
