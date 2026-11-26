class Solution {
    // Divide and conquer: merge lists in pairs (the C++ reference uses a heap).
    private ListNode mergeTwo(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = (a != null) ? a : b;
        return dummy.next;
    }

    public ListNode mergeKLists(ListNode[] lists) {
        if (lists.length == 0) return null;
        for (int step = 1; step < lists.length; step *= 2) {
            for (int i = 0; i + step < lists.length; i += 2 * step) {
                lists[i] = mergeTwo(lists[i], lists[i + step]);
            }
        }
        return lists[0];
    }
}
