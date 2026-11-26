class Solution {
    // Two passes: count the nodes, then remove index (length - n) from the front.
    public ListNode removeNthFromEnd(ListNode head, int n) {
        int length = 0;
        for (ListNode p = head; p != null; p = p.next) length++;
        int target = length - n;
        if (target == 0) return head.next;
        ListNode prev = head;
        for (int i = 1; i < target; i++) prev = prev.next;
        prev.next = prev.next.next;
        return head;
    }
}
