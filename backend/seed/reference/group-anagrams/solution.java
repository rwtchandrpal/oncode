class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>(); // key: letter counts
        for (String s : strs) {
            int[] count = new int[26];
            for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;
            groups.computeIfAbsent(Arrays.toString(count), k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}
