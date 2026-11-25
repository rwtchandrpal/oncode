class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        // Bottom-up: combos[a] = all combinations for amount a, built candidate by candidate
        // (each list is non-decreasing in candidate order, so no duplicates arise).
        List<List<List<Integer>>> combos = new ArrayList<>();
        for (int a = 0; a <= target; a++) combos.add(new ArrayList<>());
        combos.get(0).add(new ArrayList<>());
        for (int c : candidates) {
            for (int a = c; a <= target; a++) {
                for (List<Integer> prev : combos.get(a - c)) {
                    List<Integer> next = new ArrayList<>(prev);
                    next.add(c);
                    combos.get(a).add(next);
                }
            }
        }
        return combos.get(target);
    }
}
