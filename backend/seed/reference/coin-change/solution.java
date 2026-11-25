class Solution {
    public int coinChange(int[] coins, int amount) {
        final int INF = Integer.MAX_VALUE;
        int[] best = new int[amount + 1]; // best[a] = fewest coins for amount a
        Arrays.fill(best, INF);
        best[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a && best[a - c] != INF) best[a] = Math.min(best[a], best[a - c] + 1);
            }
        }
        return best[amount] == INF ? -1 : best[amount];
    }
}
