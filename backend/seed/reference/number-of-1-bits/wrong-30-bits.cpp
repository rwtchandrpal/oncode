// Wrong: only looks at the low 30 bits, so bit 30 is never counted. Must be rejected.
class Solution {
public:
    int hammingWeight(int n) {
        int count = 0;
        for (int i = 0; i < 30; i++)
            if (n >> i & 1) count++;
        return count;
    }
};
