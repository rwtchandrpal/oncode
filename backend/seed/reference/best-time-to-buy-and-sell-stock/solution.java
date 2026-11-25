class Solution {
    public int maxProfit(int[] prices) {
        int lowest = Integer.MAX_VALUE, best = 0;
        for (int p : prices) {
            lowest = Math.min(lowest, p);
            best = Math.max(best, p - lowest);
        }
        return best;
    }
}
