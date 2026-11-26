class MedianFinder {
    // Keeps a sorted list with binary-search insertion (the C++ reference uses two heaps).
    private final List<Integer> sorted = new ArrayList<>();

    public MedianFinder() {
    }

    public void addNum(int num) {
        int lo = 0, hi = sorted.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (sorted.get(mid) < num) lo = mid + 1;
            else hi = mid;
        }
        sorted.add(lo, num);
    }

    public double findMedian() {
        int n = sorted.size();
        if (n % 2 == 1) return sorted.get(n / 2);
        return ((long) sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
    }
}
