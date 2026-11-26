class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        // min-heap of the current front node of every list: O(N log k)
        auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
        priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> heap(cmp);
        for (ListNode* l : lists) if (l) heap.push(l);
        ListNode dummy;
        ListNode* tail = &dummy;
        while (!heap.empty()) {
            ListNode* n = heap.top();
            heap.pop();
            tail->next = n;
            tail = n;
            if (n->next) heap.push(n->next);
        }
        tail->next = nullptr;
        return dummy.next;
    }
};
