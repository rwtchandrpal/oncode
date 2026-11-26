class MedianFinder {
    priority_queue<int> low;                             // smaller half, max on top
    priority_queue<int, vector<int>, greater<int>> high;  // larger half, min on top
public:
    MedianFinder() {}

    void addNum(int num) {
        low.push(num);
        high.push(low.top());  // move the largest of the small half up
        low.pop();
        if (high.size() > low.size()) {  // keep low the same size or one bigger
            low.push(high.top());
            high.pop();
        }
    }

    double findMedian() {
        if (low.size() > high.size()) return low.top();
        return ((double)low.top() + high.top()) / 2.0;
    }
};
