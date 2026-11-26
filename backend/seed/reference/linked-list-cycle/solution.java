class Solution {
    // Remembers visited nodes by identity (the C++ reference uses Floyd's two pointers).
    public boolean hasCycle(ListNode head) {
        Set<ListNode> seen = Collections.newSetFromMap(new IdentityHashMap<>());
        for (ListNode n = head; n != null; n = n.next) {
            if (!seen.add(n)) return true;
        }
        return false;
    }
}
