const { IO_CPP, IO_JAVA } = require("../tools/lib/codegen");

const nodeDocCpp = `/*
// Definition for a Node.
class Node {
public:
    int val;
    vector<Node*> neighbors;
    Node() { val = 0; neighbors = vector<Node*>(); }
    Node(int _val) { val = _val; neighbors = vector<Node*>(); }
    Node(int _val, vector<Node*> _neighbors) { val = _val; neighbors = _neighbors; }
};
*/`;

const nodeDocJava = `/*
// Definition for a Node.
class Node {
    public int val;
    public List<Node> neighbors;
    public Node() { val = 0; neighbors = new ArrayList<Node>(); }
    public Node(int _val) { val = _val; neighbors = new ArrayList<Node>(); }
    public Node(int _val, ArrayList<Node> _neighbors) { val = _val; neighbors = _neighbors; }
}
*/`;

const userCpp = `${nodeDocCpp}

class Solution {
public:
    Node* cloneGraph(Node* node) {
        // Write your solution here
        return nullptr;
    }
};`;

const userJava = `${nodeDocJava}

class Solution {
    public Node cloneGraph(Node node) {
        // Write your solution here
        return null;
    }
}`;

// Builds nodes 1..n from the adjacency list, clones from node 1, then walks the clone:
// every reachable clone node must be new (not an original), with values 1..n each once.
// Prints the clone's adjacency list, or a message string when the result is not a valid deep copy.
const driverCpp = `#include <bits/stdc++.h>
using namespace std;

class Node {
public:
    int val;
    vector<Node*> neighbors;
    Node() { val = 0; neighbors = vector<Node*>(); }
    Node(int _val) { val = _val; neighbors = vector<Node*>(); }
    Node(int _val, vector<Node*> _neighbors) { val = _val; neighbors = _neighbors; }
};

{{USER_CODE}}

${IO_CPP}

int main() {
    oncode::Reader oc_in;
    vector<vector<int>> adjList;
    oc_in.read(adjList);
    oc_in.end();
    int n = (int)adjList.size();
    vector<Node*> oc_orig(n);
    for (int i = 0; i < n; i++) oc_orig[i] = new Node(i + 1);
    for (int i = 0; i < n; i++)
        for (int v : adjList[i]) oc_orig[i]->neighbors.push_back(oc_orig[v - 1]);
    unordered_set<Node*> oc_originals(oc_orig.begin(), oc_orig.end());
    Solution oc_sol;
    Node* oc_res = oc_sol.cloneGraph(n ? oc_orig[0] : nullptr);
    oncode::Writer oc_out;
    string oc_problem;
    vector<vector<int>> oc_adj(n);
    vector<Node*> oc_byVal(n + 1, nullptr);
    vector<Node*> oc_queue;
    if (oc_res) oc_queue.push_back(oc_res);
    unordered_set<Node*> oc_seen(oc_queue.begin(), oc_queue.end());
    for (size_t h = 0; h < oc_queue.size() && oc_problem.empty(); h++) {
        Node* x = oc_queue[h];
        if (oc_originals.count(x)) { oc_problem = "returned graph shares nodes with the original"; break; }
        if (x->val < 1 || x->val > n || (oc_byVal[x->val] && oc_byVal[x->val] != x)) { oc_problem = "clone has missing, extra or duplicate node values"; break; }
        oc_byVal[x->val] = x;
        for (Node* y : x->neighbors) {
            oc_adj[x->val - 1].push_back(y ? y->val : 0);
            if (y && !oc_seen.count(y)) { oc_seen.insert(y); oc_queue.push_back(y); }
        }
    }
    if (oc_problem.empty() && (int)oc_queue.size() != n) oc_problem = "clone has missing, extra or duplicate node values";
    for (auto& oc_l : oc_adj) sort(oc_l.begin(), oc_l.end());  // neighbour order does not matter
    if (oc_problem.empty()) oc_out.write(oc_adj);
    else oc_out.write(oc_problem);
    oc_out.line();
    oc_out.flush();
    return 0;
}`;

const driverJava = `import java.util.*;
import java.io.*;

{{USER_CODE}}

class Node {
    public int val;
    public List<Node> neighbors;
    public Node() { val = 0; neighbors = new ArrayList<Node>(); }
    public Node(int _val) { val = _val; neighbors = new ArrayList<Node>(); }
    public Node(int _val, ArrayList<Node> _neighbors) { val = _val; neighbors = _neighbors; }
}

public class Main {
${IO_JAVA}

    public static void main(String[] oc_args) throws IOException {
        initInput();
        List<List<Integer>> adjList = readIntListList();
        endInput();
        int n = adjList.size();
        Node[] oc_orig = new Node[n];
        for (int i = 0; i < n; i++) oc_orig[i] = new Node(i + 1);
        for (int i = 0; i < n; i++) for (int v : adjList.get(i)) oc_orig[i].neighbors.add(oc_orig[v - 1]);
        Set<Node> oc_originals = Collections.newSetFromMap(new IdentityHashMap<>());
        oc_originals.addAll(Arrays.asList(oc_orig));
        Node oc_res = new Solution().cloneGraph(n > 0 ? oc_orig[0] : null);
        String oc_problem = null;
        List<List<Integer>> oc_adj = new ArrayList<>();
        for (int i = 0; i < n; i++) oc_adj.add(new ArrayList<>());
        Node[] oc_byVal = new Node[n + 1];
        List<Node> oc_queue = new ArrayList<>();
        Set<Node> oc_seen = Collections.newSetFromMap(new IdentityHashMap<>());
        if (oc_res != null) { oc_queue.add(oc_res); oc_seen.add(oc_res); }
        for (int h = 0; h < oc_queue.size() && oc_problem == null; h++) {
            Node x = oc_queue.get(h);
            if (oc_originals.contains(x)) { oc_problem = "returned graph shares nodes with the original"; break; }
            if (x.val < 1 || x.val > n || (oc_byVal[x.val] != null && oc_byVal[x.val] != x)) { oc_problem = "clone has missing, extra or duplicate node values"; break; }
            oc_byVal[x.val] = x;
            for (Node y : x.neighbors) {
                oc_adj.get(x.val - 1).add(y == null ? 0 : y.val);
                if (y != null && oc_seen.add(y)) oc_queue.add(y);
            }
        }
        if (oc_problem == null && oc_queue.size() != n) oc_problem = "clone has missing, extra or duplicate node values";
        for (List<Integer> oc_l : oc_adj) Collections.sort(oc_l); // neighbour order does not matter
        if (oc_problem == null) write(oc_adj);
        else write(oc_problem);
        OUT.append('\\n');
        flushOutput();
    }
}`;

module.exports = {
  slug: "clone-graph",
  signature: { method: "cloneGraph", params: [{ name: "adjList", type: "List<List<int>>" }], returns: "List<List<int>>" },
  drivers: () => ({
    cpp: { userSnippet: userCpp, driverCode: driverCpp },
    java: { userSnippet: userJava, driverCode: driverJava },
  }),
  description: `
You are given a reference to one node of a **connected, undirected** graph. Each \`Node\` holds an integer \`val\` and a list of its \`neighbors\`. Return a **deep copy** of the whole graph: a new node for every original node, with the same values and the same connections, and no references back into the original graph.

**Test format:** the graph is given as an adjacency list \`adjList\`, where the nodes have values \`1\` to \`n\` and \`adjList[i]\` lists the neighbours of the node with value \`i + 1\`. The judge passes the node with value \`1\` to \`cloneGraph\` (or null for an empty graph), checks that the returned graph shares no nodes with the original, and prints the clone's adjacency list in the same format (each neighbour list sorted, so neighbour order does not matter).
`,
  constraints: [
    "The number of nodes is between 0 and 100",
    "Node values are 1..n and unique",
    "The graph is connected, with no repeated edges and no self-loops",
  ],
  examples: [
    { explanation: "Four nodes in a cycle 1-2-3-4-1. The copy has the same connections." },
    { explanation: "An empty graph: the input node is null and so is the answer." },
    { explanation: "A single node with no neighbours." },
  ],
  notes: "Custom driver: builds the graph, checks the clone is a deep copy, prints its adjacency list.",
};
