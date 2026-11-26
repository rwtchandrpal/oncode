// Wrong: averages the two middle values with integer division (2.5 becomes 2).
class MedianFinder {
    multiset<int> values;
public:
    MedianFinder() {}
    void addNum(int num) { values.insert(num); }
    double findMedian() {
        auto it = values.begin();
        advance(it, (values.size() - 1) / 2);
        if (values.size() % 2) return *it;
        int a = *it;
        int b = *next(it);
        return (a + b) / 2;
    }
};
