// ===== Oncode driver I/O (inlined by backend/seed/tools/lib/codegen.js) =====
// Input: one value per line in canonical form (see backend/seed/FORMAT.md). Output: canonical form.
namespace oncode {

// Nullable int, for level-order tree arrays such as [1,null,2].
struct Opt {
    bool has = false;
    int v = 0;
};

struct Reader {
    std::string s;
    size_t p = 0;
    Reader() {
        std::ios::sync_with_stdio(false);
        s.assign(std::istreambuf_iterator<char>(std::cin), std::istreambuf_iterator<char>());
    }
    [[noreturn]] void fail(const char* what) {
        std::cerr << "driver input error: " << what << " at byte " << p << "\n";
        std::exit(3);
    }
    void ws() {
        while (p < s.size() && std::isspace(static_cast<unsigned char>(s[p]))) p++;
    }
    bool peek(char c) {
        ws();
        return p < s.size() && s[p] == c;
    }
    void expect(char c) {
        if (!peek(c)) fail("unexpected character");
        p++;
    }
    long long integer(long long lo, long long hi) {
        ws();
        bool neg = false;
        if (p < s.size() && s[p] == '-') { neg = true; p++; }
        size_t start = p;
        long long v = 0;
        while (p < s.size() && std::isdigit(static_cast<unsigned char>(s[p]))) {
            if (p - start >= 18) fail("integer too long");
            v = v * 10 + (s[p++] - '0');
        }
        if (p == start) fail("expected integer");
        if (neg) v = -v;
        if (v < lo || v > hi) fail("integer out of range");
        return v;
    }
    void read(int& x) { x = static_cast<int>(integer(INT_MIN, INT_MAX)); }
    void read(long long& x) { x = integer(-999999999999999999LL, 999999999999999999LL); }
    void read(bool& x) {
        ws();
        if (s.compare(p, 4, "true") == 0) { x = true; p += 4; }
        else if (s.compare(p, 5, "false") == 0) { x = false; p += 5; }
        else fail("expected true or false");
    }
    void read(std::string& x) {
        expect('"');
        x.clear();
        while (p < s.size() && s[p] != '"') {
            if (s[p] == '\\') {
                p++;
                if (p >= s.size()) break;
            }
            x += s[p++];
        }
        if (p >= s.size()) fail("unterminated string");
        p++;
    }
    void read(Opt& o) {
        ws();
        if (s.compare(p, 4, "null") == 0) { o.has = false; p += 4; }
        else { o.has = true; o.v = static_cast<int>(integer(INT_MIN, INT_MAX)); }
    }
    void read(char& x) {
        std::string t;
        read(t);
        if (t.size() != 1) fail("expected one-character string");
        x = t[0];
    }
    template <class T> void read(std::vector<T>& v) {
        v.clear();
        expect('[');
        if (peek(']')) { p++; return; }
        for (;;) {
            T e;
            read(e);
            v.push_back(std::move(e));
            if (peek(',')) { p++; continue; }
            expect(']');
            return;
        }
    }
    void end() {
        ws();
        if (p != s.size()) fail("unexpected trailing input");
    }
};

struct Writer {
    std::string out;
    void write(int x) { out += std::to_string(x); }
    void write(long long x) { out += std::to_string(x); }
    void write(bool x) { out += x ? "true" : "false"; }
    void write(const std::string& x) {
        out += '"';
        for (char c : x) {
            if (c == '"' || c == '\\') out += '\\';
            out += c;
        }
        out += '"';
    }
    void write(char c) { write(std::string(1, c)); }
    void write(const Opt& o) {
        if (o.has) write(o.v);
        else out += "null";
    }
    template <class T> void write(const std::vector<T>& v) {
        out += '[';
        for (size_t i = 0; i < v.size(); i++) {
            if (i) out += ',';
            write(v[i]);
        }
        out += ']';
    }
    void line() { out += '\n'; }
    void flush() {
        std::fwrite(out.data(), 1, out.size(), stdout);
        std::fflush(stdout);
    }
};

}  // namespace oncode
