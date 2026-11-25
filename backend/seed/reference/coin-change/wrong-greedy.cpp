// Wrong: always takes the largest coin that fits. Must be rejected.
class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        sort(coins.rbegin(), coins.rend());
        int count = 0;
        for (int c : coins) {
            while (amount >= c) { amount -= c; count++; }
        }
        return amount == 0 ? count : -1;
    }
};
