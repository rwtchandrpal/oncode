class Solution {
    // Escaping scheme (the C++ reference uses length prefixes): "/" becomes "//", and each string
    // ends with "/e". A lone "/" is never followed by anything but "/" or "e".
    public String encode(List<String> strs) {
        StringBuilder sb = new StringBuilder();
        for (String s : strs) sb.append(s.replace("/", "//")).append("/e");
        return sb.toString();
    }

    public List<String> decode(String str) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            if (c == '/') {
                char next = str.charAt(++i);
                if (next == 'e') {
                    out.add(cur.toString());
                    cur.setLength(0);
                } else {
                    cur.append('/');
                }
            } else {
                cur.append(c);
            }
        }
        return out;
    }
}
