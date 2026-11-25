class Solution {
    // Iterative three-colour DFS cycle detection (independent of the C++ Kahn's algorithm).
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> needs = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) needs.add(new ArrayList<>());
        for (int[] p : prerequisites) needs.get(p[0]).add(p[1]);
        int[] state = new int[numCourses]; // 0 = new, 1 = on the current path, 2 = finished
        int[] iter = new int[numCourses];
        for (int s = 0; s < numCourses; s++) {
            if (state[s] != 0) continue;
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(s);
            state[s] = 1;
            while (!stack.isEmpty()) {
                int c = stack.peek();
                if (iter[c] < needs.get(c).size()) {
                    int d = needs.get(c).get(iter[c]++);
                    if (state[d] == 1) return false; // back edge: a loop
                    if (state[d] == 0) {
                        state[d] = 1;
                        stack.push(d);
                    }
                } else {
                    state[c] = 2;
                    stack.pop();
                }
            }
        }
        return true;
    }
}
