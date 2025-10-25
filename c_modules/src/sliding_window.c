#include "sliding_window.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>

#define MAX_ARRAY_SIZE 10000000

// Result for one window
typedef struct {
    double max;
    double min;
    double avg;
    char pattern[32];
} WindowStats;

typedef struct {
    WindowStats *windows;
    size_t num_windows;
    size_t window_size;
} WindowResult;

// Deque for efficient min/max tracking
typedef struct {
    size_t *indices;
    size_t front;
    size_t back;
    size_t capacity;
} Deque;

static Deque* createDeque(size_t capacity) {
    Deque *dq = malloc(sizeof(Deque));
    if (!dq) return NULL;
    
    dq->indices = malloc(capacity * sizeof(size_t));
    if (!dq->indices) {
        free(dq);
        return NULL;
    }
    
    dq->front = 0;
    dq->back = 0;
    dq->capacity = capacity;
    return dq;
}

static void freeDeque(Deque *dq) {
    if (dq) {
        free(dq->indices);
        free(dq);
    }
}

static inline int isEmpty(const Deque *dq) {
    return dq->front == dq->back;
}

static inline void pushBack(Deque *dq, size_t idx) {
    dq->indices[dq->back] = idx;
    dq->back = (dq->back + 1) % dq->capacity;
}

static inline void popBack(Deque *dq) {
    dq->back = (dq->back - 1 + dq->capacity) % dq->capacity;
}

static inline void popFront(Deque *dq) {
    dq->front = (dq->front + 1) % dq->capacity;
}

static inline size_t front(const Deque *dq) {
    return dq->indices[dq->front];
}

static inline size_t back(const Deque *dq) {
    size_t idx = (dq->back - 1 + dq->capacity) % dq->capacity;
    return dq->indices[idx];
}

static void setError(char *err_buf, size_t err_buf_len, const char *msg) {
    if (err_buf && err_buf_len > 0) {
        strncpy(err_buf, msg, err_buf_len - 1);
        err_buf[err_buf_len - 1] = '\0';
    }
}

// Classify pattern based on statistics
static void classifyPattern(double first, double last, double variance, 
                           double mean, char *pattern, size_t pattern_len) {
    double change_pct = fabs((last - first) / first);
    double cv = sqrt(variance) / fabs(mean);  // Coefficient of variation
    
    if (change_pct > 0.05 && last > first) {
        strncpy(pattern, "bullish", pattern_len - 1);
    } else if (change_pct > 0.05 && last < first) {
        strncpy(pattern, "bearish", pattern_len - 1);
    } else if (cv > 0.1) {
        strncpy(pattern, "volatile", pattern_len - 1);
    } else {
        strncpy(pattern, "stable", pattern_len - 1);
    }
    pattern[pattern_len - 1] = '\0';
}

int analyzeSlidingWindow(const double *prices, size_t length, size_t windowSize,
                         void **out_window_result_handle, char *err_buf, size_t err_buf_len) {
    // Validate inputs
    if (!prices || !out_window_result_handle) {
        setError(err_buf, err_buf_len, "NULL pointer argument");
        return -1;
    }
    
    if (length == 0 || length > MAX_ARRAY_SIZE || windowSize == 0 || windowSize > length) {
        setError(err_buf, err_buf_len, "Invalid length or window size");
        return -2;
    }
    
    // Validate prices
    for (size_t i = 0; i < length; i++) {
        if (isnan(prices[i]) || isinf(prices[i])) {
            setError(err_buf, err_buf_len, "Invalid price value");
            return -4;
        }
    }
    
    size_t num_windows = length - windowSize + 1;
    
    // Allocate result structure
    WindowResult *result = malloc(sizeof(WindowResult));
    if (!result) {
        setError(err_buf, err_buf_len, "Memory allocation failed");
        return -3;
    }
    
    result->windows = malloc(num_windows * sizeof(WindowStats));
    if (!result->windows) {
        free(result);
        setError(err_buf, err_buf_len, "Memory allocation failed for windows");
        return -3;
    }
    
    result->num_windows = num_windows;
    result->window_size = windowSize;
    
    // Create deques for min/max tracking - O(1) amortized per element
    Deque *max_dq = createDeque(windowSize + 1);
    Deque *min_dq = createDeque(windowSize + 1);
    
    if (!max_dq || !min_dq) {
        freeDeque(max_dq);
        freeDeque(min_dq);
        free(result->windows);
        free(result);
        setError(err_buf, err_buf_len, "Memory allocation failed for deques");
        return -3;
    }
    
    // Process first window
    double sum = 0.0;
    double sum_sq = 0.0;
    
    for (size_t i = 0; i < windowSize; i++) {
        sum += prices[i];
        sum_sq += prices[i] * prices[i];
        
        // Maintain max deque (decreasing order)
        while (!isEmpty(max_dq) && prices[back(max_dq)] <= prices[i]) {
            popBack(max_dq);
        }
        pushBack(max_dq, i);
        
        // Maintain min deque (increasing order)
        while (!isEmpty(min_dq) && prices[back(min_dq)] >= prices[i]) {
            popBack(min_dq);
        }
        pushBack(min_dq, i);
    }
    
    // Store first window result
    double avg = sum / windowSize;
    double variance = (sum_sq / windowSize) - (avg * avg);
    result->windows[0].max = prices[front(max_dq)];
    result->windows[0].min = prices[front(min_dq)];
    result->windows[0].avg = avg;
    classifyPattern(prices[0], prices[windowSize - 1], variance, avg,
                   result->windows[0].pattern, sizeof(result->windows[0].pattern));
    
    // Slide window - O(n) total time
    for (size_t i = 1; i < num_windows; i++) {
        size_t out_idx = i - 1;
        size_t in_idx = i + windowSize - 1;
        
        // Update sum and sum_sq
        sum = sum - prices[out_idx] + prices[in_idx];
        sum_sq = sum_sq - (prices[out_idx] * prices[out_idx]) + (prices[in_idx] * prices[in_idx]);
        
        // Remove elements outside window from deques
        while (!isEmpty(max_dq) && front(max_dq) <= out_idx) {
            popFront(max_dq);
        }
        while (!isEmpty(min_dq) && front(min_dq) <= out_idx) {
            popFront(min_dq);
        }
        
        // Add new element to deques
        while (!isEmpty(max_dq) && prices[back(max_dq)] <= prices[in_idx]) {
            popBack(max_dq);
        }
        pushBack(max_dq, in_idx);
        
        while (!isEmpty(min_dq) && prices[back(min_dq)] >= prices[in_idx]) {
            popBack(min_dq);
        }
        pushBack(min_dq, in_idx);
        
        // Store window result
        avg = sum / windowSize;
        variance = (sum_sq / windowSize) - (avg * avg);
        result->windows[i].max = prices[front(max_dq)];
        result->windows[i].min = prices[front(min_dq)];
        result->windows[i].avg = avg;
        classifyPattern(prices[i], prices[in_idx], variance, avg,
                       result->windows[i].pattern, sizeof(result->windows[i].pattern));
    }
    
    freeDeque(max_dq);
    freeDeque(min_dq);
    
    *out_window_result_handle = result;
    return 0;
}

int getWindowResult(void *window_handle, size_t idx,
                    double *out_max, double *out_min, double *out_avg,
                    char *out_pattern, size_t out_pattern_len,
                    char *err_buf, size_t err_len) {
    if (!window_handle) {
        setError(err_buf, err_len, "NULL window handle");
        return -1;
    }
    
    WindowResult *result = (WindowResult*)window_handle;
    
    if (idx >= result->num_windows) {
        setError(err_buf, err_len, "Window index out of bounds");
        return -2;
    }
    
    if (out_max) *out_max = result->windows[idx].max;
    if (out_min) *out_min = result->windows[idx].min;
    if (out_avg) *out_avg = result->windows[idx].avg;
    
    if (out_pattern && out_pattern_len > 0) {
        strncpy(out_pattern, result->windows[idx].pattern, out_pattern_len - 1);
        out_pattern[out_pattern_len - 1] = '\0';
    }
    
    return 0;
}

void freeWindowResult(void *window_handle) {
    if (window_handle) {
        WindowResult *result = (WindowResult*)window_handle;
        free(result->windows);
        free(result);
    }
}
