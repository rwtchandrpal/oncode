class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        const int INF = INT_MAX;
        vector<int> best(amount + 1, INF);  // best[a] = fewest coins for amount a
        best[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a && best[a - c] != INF) best[a] = min(best[a], best[a - c] + 1);
            }
        }
        return best[amount] == INF ? -1 : best[amount];
    }
};
