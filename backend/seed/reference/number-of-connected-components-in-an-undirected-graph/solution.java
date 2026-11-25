class Solution {
    // Iterative DFS over an adjacency list (independent of the C++ union-find).
    public int countComponents(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        boolean[] seen = new boolean[n];
        int components = 0;
        Deque<Integer> stack = new ArrayDeque<>();
        for (int s = 0; s < n; s++) {
            if (seen[s]) continue;
            components++;
            seen[s] = true;
            stack.push(s);
            while (!stack.isEmpty()) {
                int u = stack.pop();
                for (int v : adj.get(u)) {
                    if (!seen[v]) {
                        seen[v] = true;
                        stack.push(v);
                    }
                }
            }
        }
        return components;
    }
}
