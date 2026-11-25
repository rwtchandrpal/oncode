class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) freq.merge(x, 1, Integer::sum);
        // min-heap of size k by frequency
        PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> Integer.compare(freq.get(a), freq.get(b)));
        for (int v : freq.keySet()) {
            heap.add(v);
            if (heap.size() > k) heap.poll();
        }
        int[] result = new int[k];
        for (int i = 0; i < k; i++) result[i] = heap.poll();
        return result;
    }
}
