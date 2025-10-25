#include "stock_span.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>

#define MAX_ARRAY_SIZE 10000000  // 10M elements max

// Stack node for tracking indices
typedef struct {
    size_t *data;
    size_t top;
    size_t capacity;
} IndexStack;

static IndexStack* createStack(size_t capacity) {
    IndexStack *stack = malloc(sizeof(IndexStack));
    if (!stack) return NULL;
    
    stack->data = malloc(capacity * sizeof(size_t));
    if (!stack->data) {
        free(stack);
        return NULL;
    }
    
    stack->top = 0;
    stack->capacity = capacity;
    return stack;
}

static void freeStack(IndexStack *stack) {
    if (stack) {
        free(stack->data);
        free(stack);
    }
}

static inline int isEmpty(const IndexStack *stack) {
    return stack->top == 0;
}

static inline void push(IndexStack *stack, size_t value) {
    stack->data[stack->top++] = value;
}

static inline size_t pop(IndexStack *stack) {
    return stack->data[--stack->top];
}

static inline size_t peek(const IndexStack *stack) {
    return stack->data[stack->top - 1];
}

static void setError(char *err_buf, size_t err_buf_len, const char *msg) {
    if (err_buf && err_buf_len > 0) {
        strncpy(err_buf, msg, err_buf_len - 1);
        err_buf[err_buf_len - 1] = '\0';
    }
}

int calculateStockSpan(const double *prices, size_t length, int **out_spans,
                       char *err_buf, size_t err_buf_len) {
    // Validate inputs
    if (!prices || !out_spans) {
        setError(err_buf, err_buf_len, "NULL pointer argument");
        return -1;
    }
    
    if (length == 0 || length > MAX_ARRAY_SIZE) {
        setError(err_buf, err_buf_len, "Invalid array length");
        return -2;
    }
    
    // Validate price values
    for (size_t i = 0; i < length; i++) {
        if (isnan(prices[i]) || isinf(prices[i])) {
            setError(err_buf, err_buf_len, "Invalid price value (NaN or infinite)");
            return -4;
        }
    }
    
    // Allocate output array
    *out_spans = malloc(length * sizeof(int));
    if (!*out_spans) {
        setError(err_buf, err_buf_len, "Memory allocation failed for spans array");
        return -3;
    }
    
    // Create stack for indices
    IndexStack *stack = createStack(length);
    if (!stack) {
        free(*out_spans);
        *out_spans = NULL;
        setError(err_buf, err_buf_len, "Memory allocation failed for stack");
        return -3;
    }
    
    // Calculate spans using stack-based algorithm - O(n) complexity
    // Each element is pushed and popped at most once
    for (size_t i = 0; i < length; i++) {
        // Pop elements while stack is not empty and top element's price
        // is less than or equal to current price
        while (!isEmpty(stack) && prices[peek(stack)] <= prices[i]) {
            pop(stack);
        }
        
        // If stack is empty, span is i+1 (all previous elements)
        // Otherwise, span is distance from current to top of stack
        (*out_spans)[i] = isEmpty(stack) ? (int)(i + 1) : (int)(i - peek(stack));
        
        // Push current index
        push(stack, i);
    }
    
    freeStack(stack);
    return 0;
}
