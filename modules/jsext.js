function callingFunction() {
    const error = new Error();
    const stack = error.stack.split('\n');
    // The caller is usually the third item in the stack trace
    const caller = stack[2].trim();
    const callerName = caller.match(/at (\w+)/)[1];
    return callerName;
}

/**
 * Retrieve all subsets excluding trivial ones (length 1 or containing all elements)
 * e.g. getSubsets([1,2,3]) => [[1,2],[2,3],[1,3]]
 * 
 * @param {Array} arr - Array of any type T to build subsets from
 * @param {number} minLength - minimum length of subsets (default: 2)
 * @param {number} maxLength - maximum length of subsets (default: length-1)
 * @returns Array of Arrays of type T
 */
function getSubsets(arr,minLength,maxLength) {
  const result = [];
  const n = arr.length;
  if (!minLength) minLength=2;
  if (!maxLength) maxLength=n-1;

  // total number of subsets = 2^n
  for (let mask = 0; mask < (1 << n); mask++) {
    const subset = [];

    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(arr[i]);
      }
    }

    // keep only subsets with length > 1 and < n
    if (subset.length >= minLength && subset.length <= maxLength) {
      result.push(subset);
    }
  }

  return result;
}


const jsext = {
    caller: callingFunction,
    getSubsets
}

export default jsext;