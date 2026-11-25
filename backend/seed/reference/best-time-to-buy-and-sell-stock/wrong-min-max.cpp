// Wrong: global max minus global min, ignoring that the sale must come after the purchase.
class Solution {
public:
    int maxProfit(vector<int>& prices) {
        return *max_element(prices.begin(), prices.end()) - *min_element(prices.begin(), prices.end());
    }
};
