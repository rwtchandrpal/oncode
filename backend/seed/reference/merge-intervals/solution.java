class Solution {
    public int[][] merge(int[][] intervals) {
        // Coverage counting over the (small) coordinate range: mark where intervals start and end.
        int max = 0;
        for (int[] iv : intervals) max = Math.max(max, iv[1]);
        int[] opens = new int[max + 2], closes = new int[max + 2];
        for (int[] iv : intervals) {
            opens[iv[0]]++;
            closes[iv[1]]++;
        }
        List<int[]> result = new ArrayList<>();
        int active = 0, start = -1;
        for (int x = 0; x <= max; x++) {
            if (opens[x] > 0 && active == 0) start = x;
            active += opens[x];
            active -= closes[x];
            if (active == 0 && start >= 0 && (opens[x] > 0 || closes[x] > 0)) {
                result.add(new int[] {start, x});
                start = -1;
            }
        }
        return result.toArray(new int[0][]);
    }
}
