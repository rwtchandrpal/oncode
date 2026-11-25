    // ===== Oncode driver I/O (inlined by backend/seed/tools/lib/codegen.js) =====
    // Input: one value per line in canonical form (see backend/seed/FORMAT.md). Output: canonical form.
    static byte[] inBuf;
    static int inPos;
    static final StringBuilder OUT = new StringBuilder();

    interface ElemReader<T> { T read(); }

    static void initInput() throws IOException {
        inBuf = System.in.readAllBytes();
        inPos = 0;
    }
    static RuntimeException fail(String what) {
        return new IllegalStateException("driver input error: " + what + " at byte " + inPos);
    }
    static void ws() {
        while (inPos < inBuf.length && (inBuf[inPos] == ' ' || inBuf[inPos] == '\n' || inBuf[inPos] == '\r' || inBuf[inPos] == '\t')) inPos++;
    }
    static boolean peek(char c) {
        ws();
        return inPos < inBuf.length && inBuf[inPos] == c;
    }
    static void expect(char c) {
        if (!peek(c)) throw fail("expected '" + c + "'");
        inPos++;
    }
    static long readInteger(long lo, long hi) {
        ws();
        boolean neg = false;
        if (inPos < inBuf.length && inBuf[inPos] == '-') { neg = true; inPos++; }
        int start = inPos;
        long v = 0;
        while (inPos < inBuf.length && inBuf[inPos] >= '0' && inBuf[inPos] <= '9') {
            if (inPos - start >= 18) throw fail("integer too long");
            v = v * 10 + (inBuf[inPos++] - '0');
        }
        if (inPos == start) throw fail("expected integer");
        if (neg) v = -v;
        if (v < lo || v > hi) throw fail("integer out of range");
        return v;
    }
    static int readInt() { return (int) readInteger(Integer.MIN_VALUE, Integer.MAX_VALUE); }
    static long readLong() { return readInteger(-999999999999999999L, 999999999999999999L); }
    static boolean matchWord(String w) {
        if (inPos + w.length() > inBuf.length) return false;
        for (int i = 0; i < w.length(); i++) if (inBuf[inPos + i] != w.charAt(i)) return false;
        inPos += w.length();
        return true;
    }
    static boolean readBool() {
        ws();
        if (matchWord("true")) return true;
        if (matchWord("false")) return false;
        throw fail("expected true or false");
    }
    static String readString() {
        expect('"');
        StringBuilder sb = new StringBuilder();
        while (inPos < inBuf.length && inBuf[inPos] != '"') {
            if (inBuf[inPos] == '\\') {
                inPos++;
                if (inPos >= inBuf.length) break;
            }
            sb.append((char) inBuf[inPos++]);
        }
        if (inPos >= inBuf.length) throw fail("unterminated string");
        inPos++;
        return sb.toString();
    }
    static char readChar() {
        String t = readString();
        if (t.length() != 1) throw fail("expected one-character string");
        return t.charAt(0);
    }
    static <T> List<T> readList(ElemReader<T> r) {
        List<T> list = new ArrayList<>();
        expect('[');
        if (peek(']')) { inPos++; return list; }
        while (true) {
            list.add(r.read());
            if (peek(',')) { inPos++; continue; }
            expect(']');
            return list;
        }
    }
    static List<Integer> readIntList() { return readList(Main::readInt); }
    static List<Long> readLongList() { return readList(Main::readLong); }
    static List<String> readStringList() { return readList(Main::readString); }
    static List<List<Integer>> readIntListList() { return readList(Main::readIntList); }
    static List<List<String>> readStringListList() { return readList(Main::readStringList); }
    static int[] readIntArray() {
        List<Integer> l = readIntList();
        int[] a = new int[l.size()];
        for (int i = 0; i < a.length; i++) a[i] = l.get(i);
        return a;
    }
    static long[] readLongArray() {
        List<Long> l = readLongList();
        long[] a = new long[l.size()];
        for (int i = 0; i < a.length; i++) a[i] = l.get(i);
        return a;
    }
    static String[] readStringArray() { return readStringList().toArray(new String[0]); }
    static int[][] readIntMatrix() { return readList(Main::readIntArray).toArray(new int[0][]); }
    static char[] readCharArray() {
        List<Character> l = readList(Main::readChar);
        char[] a = new char[l.size()];
        for (int i = 0; i < a.length; i++) a[i] = l.get(i);
        return a;
    }
    static char[][] readCharMatrix() { return readList(Main::readCharArray).toArray(new char[0][]); }
    static Integer readNullableInt() {
        ws();
        if (matchWord("null")) return null;
        return readInt();
    }
    static List<Integer> readNullableIntList() { return readList(Main::readNullableInt); }

    // Normalisers for problems where any order is accepted. Copies, so immutable results work too.
    static <T extends Comparable<T>> int compareLists(List<T> a, List<T> b) {
        for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
            int c = a.get(i).compareTo(b.get(i));
            if (c != 0) return c;
        }
        return Integer.compare(a.size(), b.size());
    }
    static <T extends Comparable<T>> List<List<T>> sortLists(List<List<T>> x, boolean sortInner) {
        List<List<T>> r = new ArrayList<>();
        for (List<T> v : x) {
            List<T> c = new ArrayList<>(v);
            if (sortInner) Collections.sort(c);
            r.add(c);
        }
        r.sort(Main::compareLists);
        return r;
    }
    static <T extends Comparable<T>> List<T> sortList(List<T> x) {
        List<T> r = new ArrayList<>(x);
        Collections.sort(r);
        return r;
    }
    static int[][] sortRows(int[][] x) {
        int[][] r = x.clone();
        Arrays.sort(r, (a, b) -> {
            for (int i = 0; i < Math.min(a.length, b.length); i++) if (a[i] != b[i]) return Integer.compare(a[i], b[i]);
            return Integer.compare(a.length, b.length);
        });
        return r;
    }
    static void endInput() {
        ws();
        if (inPos != inBuf.length) throw fail("unexpected trailing input");
    }

    static void writeString(String s) {
        OUT.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') OUT.append('\\');
            OUT.append(c);
        }
        OUT.append('"');
    }
    static void write(Object o) {
        if (o == null) { OUT.append("null"); return; }
        if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Short || o instanceof Byte) { OUT.append(o); return; }
        if (o instanceof String) { writeString((String) o); return; }
        if (o instanceof Character) { writeString(String.valueOf(o)); return; }
        OUT.append('[');
        if (o instanceof int[]) {
            int[] a = (int[]) o;
            for (int i = 0; i < a.length; i++) { if (i > 0) OUT.append(','); OUT.append(a[i]); }
        } else if (o instanceof long[]) {
            long[] a = (long[]) o;
            for (int i = 0; i < a.length; i++) { if (i > 0) OUT.append(','); OUT.append(a[i]); }
        } else if (o instanceof boolean[]) {
            boolean[] a = (boolean[]) o;
            for (int i = 0; i < a.length; i++) { if (i > 0) OUT.append(','); OUT.append(a[i]); }
        } else if (o instanceof char[]) {
            char[] a = (char[]) o;
            for (int i = 0; i < a.length; i++) { if (i > 0) OUT.append(','); writeString(String.valueOf(a[i])); }
        } else if (o instanceof Object[]) {
            Object[] a = (Object[]) o;
            for (int i = 0; i < a.length; i++) { if (i > 0) OUT.append(','); write(a[i]); }
        } else if (o instanceof Iterable) {
            boolean first = true;
            for (Object e : (Iterable<?>) o) { if (!first) OUT.append(','); write(e); first = false; }
        } else {
            throw new IllegalStateException("driver cannot print " + o.getClass().getName());
        }
        OUT.append(']');
    }
    static void flushOutput() {
        System.out.print(OUT);
        System.out.flush();
    }
