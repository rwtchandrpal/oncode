class Solution {
    // BFS from node 0: every node must be reached, and no edge may lead back to a visited node
    // other than the one we came from.
    public boolean validTree(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        int[] from = new int[n];
        Arrays.fill(from, -2); // -2 = not visited
        from[0] = -1;
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        queue.add(0);
        int visited = 0;
        while (!queue.isEmpty()) {
            int u = queue.poll();
            visited++;
            for (int v : adj.get(u)) {
                if (v == from[u]) continue;
                if (from[v] != -2) return false; // cycle
                from[v] = u;
                queue.add(v);
            }
        }
        return visited == n;
    }
}
