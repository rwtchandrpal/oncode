// Exponential: plain recursion without memoisation.
class Solution {
    int go(const vector<int>& coins, int amount) {
        if (amount == 0) return 0;
        int best = -1;
        for (int c : coins) {
            if (c > amount) continue;
            int sub = go(coins, amount - c);
            if (sub >= 0 && (best < 0 || sub + 1 < best)) best = sub + 1;
        }
        return best;
    }
public:
    int coinChange(vector<int>& coins, int amount) { return go(coins, amount); }
};
